// ============================================================
// CareerPilot — Demo Candidate Profiles (3 realistic entries)
// Note: All names, details are fictional demo data only.
// ============================================================
import type { CandidateProfile } from '@/types';
import { getRegisteredProfileById } from '@/lib/auth/store';

export const DEMO_CANDIDATES: CandidateProfile[] = [
  {
    id: 'candidate-001',
    name: 'Priya Sharma',
    email: 'priya.demo@careerpilot.dev',
    education: [
      {
        institution: 'BITS Pilani — Hyderabad Campus',
        degree: 'B.E.',
        field: 'Computer Science',
        year: 2027,
        cgpa: 8.4,
      },
    ],
    skills: [
      'Python',
      'Machine Learning',
      'Java',
      'SQL',
      'TensorFlow',
      'React',
      'Git',
    ],
    projects: [
      {
        name: 'Crop Disease Detector',
        description:
          'CNN-based image classification model to detect plant diseases from leaf images with 94% accuracy.',
        technologies: ['Python', 'TensorFlow', 'OpenCV', 'Flask'],
      },
      {
        name: 'Student Placement Predictor',
        description:
          'ML model predicting campus placement probability using academic and skill features.',
        technologies: ['Python', 'scikit-learn', 'Pandas', 'SQL'],
      },
    ],
    experience: [],
    preferredLocations: ['Hyderabad', 'Bangalore', 'Remote'],
    careerGoals:
      'Secure an AI/ML internship at a top tech company and contribute to real-world ML systems.',
    targetRole: 'AI/ML Intern',
    experienceLevel: 'student',
  },
  {
    id: 'candidate-002',
    name: 'Arjun Menon',
    email: 'arjun.demo@careerpilot.dev',
    education: [
      {
        institution: 'NIT Trichy',
        degree: 'B.Tech',
        field: 'Information Technology',
        year: 2026,
        cgpa: 7.9,
      },
    ],
    skills: [
      'Java',
      'Python',
      'Data Structures',
      'Algorithms',
      'Spring Boot',
      'SQL',
      'Git',
      'Linux',
    ],
    projects: [
      {
        name: 'Library Management System',
        description:
          'Full-stack web app with Spring Boot backend and React frontend for managing library resources.',
        technologies: ['Java', 'Spring Boot', 'React', 'MySQL'],
      },
      {
        name: 'Expense Tracker CLI',
        description:
          'Command-line budgeting tool with data visualization using Python.',
        technologies: ['Python', 'SQLite', 'Matplotlib'],
      },
    ],
    experience: [
      {
        company: 'CodeNation (virtual internship)',
        role: 'Software Developer Intern',
        duration: '2 months',
        description: 'Built REST APIs for a student portal using Spring Boot.',
      },
    ],
    preferredLocations: ['Bangalore', 'Chennai', 'Hyderabad'],
    careerGoals:
      'Land a Software Development Engineer role at a product company and work on high-scale distributed systems.',
    targetRole: 'SDE Intern',
    experienceLevel: 'student',
  },
  {
    id: 'candidate-003',
    name: 'Sneha Iyer',
    email: 'sneha.demo@careerpilot.dev',
    education: [
      {
        institution: 'VIT Vellore',
        degree: 'B.Tech',
        field: 'Data Science',
        year: 2027,
        cgpa: 8.8,
      },
    ],
    skills: [
      'Python',
      'SQL',
      'Statistics',
      'Machine Learning',
      'R',
      'Tableau',
      'Excel',
      'Pandas',
    ],
    projects: [
      {
        name: 'Customer Churn Analysis',
        description:
          'End-to-end ML pipeline for predicting telecom customer churn with 89% accuracy.',
        technologies: ['Python', 'scikit-learn', 'SQL', 'Tableau'],
      },
      {
        name: 'COVID Trend Visualizer',
        description:
          'Interactive data visualization dashboard for COVID-19 trends across Indian states.',
        technologies: ['Python', 'Streamlit', 'Pandas', 'Plotly'],
      },
    ],
    experience: [],
    preferredLocations: ['Hyderabad', 'Pune', 'Remote'],
    careerGoals:
      'Become a data scientist specializing in business analytics and ML at a data-driven company.',
    targetRole: 'Data Science Intern',
    experienceLevel: 'student',
  },
];

// Default candidate used for demo
export const DEFAULT_CANDIDATE_ID = 'candidate-001';

export function getCandidateById(id: string): CandidateProfile | undefined {
  return DEMO_CANDIDATES.find((c) => c.id === id) ?? getRegisteredProfileById(id);
}

export const DEFAULT_CANDIDATE = DEMO_CANDIDATES[0];
