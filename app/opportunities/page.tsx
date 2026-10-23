'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OpportunityCard from '@/components/career/OpportunityCard';
import type { CandidateProfile, Opportunity } from '@/types';

const DOMAINS = ['All', 'AI/ML', 'Data Science', 'Python Development', 'Full Stack', 'Cloud', 'Software Engineering'];
const LOCATIONS = ['All', 'Hyderabad', 'Bangalore', 'Chennai', 'Pune', 'Remote'];
const TYPES = ['All', 'internship', 'full-time'];

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDomain, setFilterDomain] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');

  const fetchOpportunities = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterLocation !== 'All') params.set('location', filterLocation);
    if (filterDomain !== 'All') params.set('role', filterDomain);
    if (candidateProfile?.skills.length) params.set('skills', candidateProfile.skills.join(','));
    if (candidateProfile?.experienceLevel) params.set('experienceLevel', candidateProfile.experienceLevel);

    const res = await fetch(`/api/opportunities?${params}`);
    if (!res.ok) throw new Error('Failed to fetch opportunities');
    const data: { opportunities: Opportunity[] } = await res.json();
    return data.opportunities;
  }, [candidateProfile, filterDomain, filterLocation]);

  useEffect(() => {
    let active = true;
    fetch('/api/profile')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load your career profile.');
        return await response.json() as CandidateProfile;
      })
      .then((profile) => {
        if (!active) return;
        setCandidateProfile(profile);
        setFilterDomain(profile.targetRole || 'All');
        setFilterLocation(profile.preferredLocations[0] ?? 'All');
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setProfileError(loadError instanceof Error ? loadError.message : 'Unable to load your career profile.');
      })
      .finally(() => {
        if (active) {
          setProfileLoaded(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    let active = true;
    fetchOpportunities()
      .then((items) => {
        if (active) setOpportunities(items);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed to load opportunities');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchOpportunities, profileLoaded]);

  const filtered = opportunities.filter((opp) => {
    if (filterType !== 'All' && opp.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        opp.role.toLowerCase().includes(q) ||
        opp.company.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* Keep the user's role and location selected as the initial match filters. */
  const hasCustomTargetRole = Boolean(
    candidateProfile?.targetRole && !DOMAINS.includes(candidateProfile.targetRole),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Opportunities</h1>
        <p className="text-slate-500">
          {candidateProfile
            ? `Roles personalized for ${candidateProfile.name} — starting with ${candidateProfile.targetRole} opportunities near ${candidateProfile.preferredLocations[0] ?? 'you'}.`
            : 'Browse internships and jobs matched to your career profile.'}
        </p>
      </div>
      {profileError && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {profileError} Showing general opportunities instead.
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Role, company, or keyword..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Domain</label>
            <select
              value={filterDomain}
              onChange={(e) => {
                setLoading(true);
                setError(null);
                setFilterDomain(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              <option>All</option>
              {hasCustomTargetRole && <option value={candidateProfile?.targetRole}>{candidateProfile?.targetRole} · your target role</option>}
              {DOMAINS.filter((domain) => domain !== 'All').map((domain) => <option key={domain}>{domain}</option>)}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
            <select
              value={filterLocation}
              onChange={(e) => {
                setLoading(true);
                setError(null);
                setFilterLocation(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
              {candidateProfile?.preferredLocations.filter((location) => !LOCATIONS.includes(location)).map((location) => <option key={location} value={location}>{location} · your preference</option>)}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              {TYPES.map((type) => <option key={type} value={type}>{type === 'All' ? 'All types' : type}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} opportunities found`}
        </p>
        <Link href="/agent" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          🎯 Ask your AI agent about these roles →
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm flex items-center gap-3">
          <span>⚠️</span>
          <div>
            <p className="font-medium">Failed to load opportunities</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchOpportunities()
                .then(setOpportunities)
                .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load opportunities'))
                .finally(() => setLoading(false));
            }}
            className="ml-auto px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="font-semibold text-slate-700 mb-2">No opportunities found</h3>
          <p className="text-sm text-slate-400 mb-6">Try adjusting your filters or ask the AI agent to find matches.</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              setFilterDomain('All');
              setFilterLocation('All');
              setFilterType('All');
              setSearch('');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onAnalyzeMatch={() =>
                router.push(
                  `/agent?prompt=Analyze+my+match+for+${encodeURIComponent(opp.role)}+at+${encodeURIComponent(opp.company)}`
                )
              }
              onAskAgent={() =>
                router.push(
                  `/agent?prompt=Tell+me+about+${encodeURIComponent(opp.role)}+at+${encodeURIComponent(opp.company)}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
