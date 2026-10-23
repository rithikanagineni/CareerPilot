'use client';
import { useState } from 'react';
import type { CareerPlan, PlanItem } from '@/types';

interface CareerPlanViewProps {
  plan: CareerPlan;
}

type ActiveTab = 'immediate' | 'week' | 'month';

const categoryConfig: Record<string, { icon: string; color: string }> = {
  skill: { icon: '📚', color: 'text-indigo-600' },
  application: { icon: '📝', color: 'text-violet-600' },
  project: { icon: '💻', color: 'text-cyan-600' },
  network: { icon: '🤝', color: 'text-emerald-600' },
  preparation: { icon: '🎯', color: 'text-amber-600' },
};

const priorityBorder: Record<string, string> = {
  high: 'border-l-red-400',
  medium: 'border-l-amber-400',
  low: 'border-l-slate-300',
};

function TaskRow({ item, checked, onToggle }: { item: PlanItem; checked: boolean; onToggle: () => void }) {
  const cat = categoryConfig[item.category] ?? { icon: '●', color: 'text-slate-500' };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border-l-4 ${priorityBorder[item.priority]} transition-all cursor-pointer select-none ${
        checked ? 'bg-slate-50 opacity-60' : 'bg-white hover:bg-indigo-50/40 border border-slate-100 border-l-0'
      }`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          <span className={`mr-1.5 ${cat.color}`}>{cat.icon}</span>
          {item.action}
        </p>
      </div>

      {/* Priority */}
      <span className={`text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full ${
        item.priority === 'high'
          ? 'bg-red-50 text-red-500'
          : item.priority === 'medium'
          ? 'bg-amber-50 text-amber-500'
          : 'bg-slate-50 text-slate-400'
      }`}>
        {item.priority}
      </span>
    </div>
  );
}

export default function CareerPlanView({ plan }: CareerPlanViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('immediate');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tabs: { key: ActiveTab; label: string; emoji: string; items: PlanItem[] }[] = [
    { key: 'immediate', label: 'Today', emoji: '⚡', items: plan.immediateActions },
    { key: 'week', label: 'This Week', emoji: '📅', items: plan.sevenDayPlan },
    { key: 'month', label: '30 Days', emoji: '🗓', items: plan.thirtyDayPlan },
  ];

  const currentItems = tabs.find((t) => t.key === activeTab)!.items;
  const completedCount = currentItems.filter((i) => checkedItems.has(i.id)).length;
  const progress = currentItems.length > 0 ? Math.round((completedCount / currentItems.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-indigo-50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-lg">🎯 Career Action Plan</h2>
            <p className="text-indigo-200 text-sm mt-0.5">{plan.targetRole}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">{progress}%</div>
            <div className="text-indigo-200 text-xs">completed</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div
            className="h-2 rounded-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-indigo-200 text-xs mt-2">
          {completedCount}/{currentItems.length} tasks done · {plan.thirtyDayPlan.length + plan.sevenDayPlan.length + plan.immediateActions.length} total
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        {tabs.map((tab) => {
          const tabCompleted = tab.items.filter((i) => checkedItems.has(i.id)).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-bold transition-colors relative ${
                activeTab === tab.key ? 'text-indigo-700 bg-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
              {tabCompleted > 0 && (
                <span className="ml-1.5 text-[9px] font-bold text-emerald-600">({tabCompleted}✓)</span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
        {currentItems.map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            checked={checkedItems.has(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>

      {/* Application strategy */}
      {plan.applicationStrategy.length > 0 && (
        <div className="border-t border-slate-50 p-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Application Strategy
          </h3>
          <ul className="space-y-1.5">
            {plan.applicationStrategy.slice(0, 3).map((tip, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
