
import React from 'react';
import { TaxCategory, WorkProject } from './types';

export const TAX_ALLOCATION_DATA = [
  { name: 'Education', value: 35, color: '#00d4ff', amountCr: 157500 },
  { name: 'Healthcare', value: 30, color: '#ff00aa', amountCr: 135000 },
  { name: 'Infrastructure', value: 15, color: '#00ff9d', amountCr: 67500 },
  { name: 'Defense', value: 12, color: '#ffb300', amountCr: 54000 },
  { name: 'Social Welfare', value: 8, color: '#9d00ff', amountCr: 36000 },
];

export const MOCK_SECTOR_WORKS: Record<string, WorkProject[]> = {
  'Education': [
    { id: 'ED-001', name: 'Digital Literacy Hubs', description: 'Installing high-speed internet and AI labs in 500 rural schools.', status: 'In-Progress', progress: 65, assignedBudget: 1200, spentBudget: 850, feedbacks: [], isOfficial: true },
    { id: 'ED-002', name: 'University Research Grants', description: 'Founding advanced quantum computing research across 10 national labs.', status: 'Planning', progress: 10, assignedBudget: 2500, spentBudget: 50, feedbacks: [], isOfficial: true },
    { id: 'ED-003', name: 'Primary School Nutrition', description: 'Nationwide program for fortified mid-day meals.', status: 'Completed', progress: 100, assignedBudget: 800, spentBudget: 790, feedbacks: [], isOfficial: true }
  ],
  'Healthcare': [
    { id: 'HC-001', name: 'Nano-Med Center', description: 'Specialized facility for precision cancer treatment.', status: 'Delayed', progress: 45, assignedBudget: 4500, spentBudget: 3200, feedbacks: [], isOfficial: true },
    { id: 'HC-002', name: 'Rural Tele-Health Network', description: 'Connecting remote villages to city specialists via VR links.', status: 'In-Progress', progress: 30, assignedBudget: 1500, spentBudget: 400, feedbacks: [], isOfficial: true }
  ],
  'Infrastructure': [
    { id: 'IF-001', name: 'Hyperloop Corridor Alpha', description: 'Next-gen transit link between major tech hubs.', status: 'In-Progress', progress: 15, assignedBudget: 12000, spentBudget: 2500, feedbacks: [], isOfficial: true },
    { id: 'IF-002', name: 'Smart Grid 2.0', description: 'Renewable energy integration and AI-managed load balancing.', status: 'Planning', progress: 5, assignedBudget: 8000, spentBudget: 100, feedbacks: [], isOfficial: true }
  ],
  'Defense': [
    { id: 'DF-001', name: 'Autonomous Border Sentinel', description: 'AI-driven drone network for automated surveillance.', status: 'In-Progress', progress: 80, assignedBudget: 5000, spentBudget: 4200, feedbacks: [], isOfficial: true }
  ]
};

export const INITIAL_TAX_DATA: TaxCategory[] = [
  { id: 'income-tax', name: 'Income Tax', data: [30, 45, 32, 50, 48, 60], taxCollected: 450000, taxAllocated: 400000, taxUsed: 250000, taxRemaining: 150000, totalTaxRemaining: 200000 },
  { id: 'corporate-tax', name: 'Corporate Tax', data: [40, 35, 55, 45, 65, 70], taxCollected: 320000, taxAllocated: 300000, taxUsed: 180000, taxRemaining: 120000, totalTaxRemaining: 140000 },
  { id: 'sales-tax-gst', name: 'Sales Tax (GST)', data: [20, 25, 40, 35, 50, 55], taxCollected: 510000, taxAllocated: 480000, taxUsed: 420000, taxRemaining: 60000, totalTaxRemaining: 90000 },
  { id: 'property-tax', name: 'Property Tax', data: [15, 20, 18, 25, 22, 30], taxCollected: 85000, taxAllocated: 70000, taxUsed: 45000, taxRemaining: 25000, totalTaxRemaining: 40000 },
  { id: 'customs-duty', name: 'Customs Duty', data: [50, 40, 45, 30, 35, 40], taxCollected: 140000, taxAllocated: 120000, taxUsed: 95000, taxRemaining: 25000, totalTaxRemaining: 45000 },
  { id: 'excise-duty', name: 'Excise Duty', data: [10, 15, 12, 18, 15, 20], taxCollected: 95000, taxAllocated: 80000, taxUsed: 60000, taxRemaining: 20000, totalTaxRemaining: 35000 },
  { id: 'wealth-tax', name: 'Wealth Tax', data: [5, 8, 7, 12, 10, 15], taxCollected: 12000, taxAllocated: 10000, taxUsed: 2000, taxRemaining: 8000, totalTaxRemaining: 10000 }
];

export const ICONS = {
  Robot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  File: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  ),
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
  ),
  Help: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  Trend: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
  ),
  Moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  ),
};
