import React from 'react';
import { Skeleton } from './Skeleton';

export const HomeSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-12 relative">
    {/* Market Quick Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card flex flex-col gap-3 p-5 bg-card border-border shadow-lg">
          <Skeleton variant="circle" width={36} height={36} className="bg-primary/20" />
          <div className="space-y-2">
            <Skeleton variant="text" width="60%" height={10} />
            <Skeleton variant="text" width="40%" height={24} className="rounded-md" />
          </div>
        </div>
      ))}
    </div>

    {/* Hero Section Skeleton */}
    <div className="relative group">
      <div className="absolute inset-0 bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="glass-card h-80 flex flex-col md:flex-row items-center justify-between p-12 bg-card border-border shadow-2xl relative overflow-hidden">
        <div className="space-y-6 w-full md:w-1/2 relative z-10">
          <Skeleton variant="rect" width={120} height={24} className="rounded-full bg-primary/20" />
          <div className="space-y-3">
            <Skeleton variant="text" width="100%" height={60} className="rounded-2xl" />
            <Skeleton variant="text" width="40%" height={30} className="rounded-xl" />
          </div>
          <Skeleton variant="text" width="80%" height={12} />
          <Skeleton variant="rect" width={180} height={50} className="rounded-xl shadow-lg" />
        </div>
        <div className="hidden md:block relative z-10">
          <Skeleton variant="circle" width={220} height={220} className="opacity-50" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={80} height={12} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 flex items-center justify-between bg-card border-border shadow-md">
              <div className="flex items-center gap-4">
                <Skeleton variant="rect" width={48} height={48} className="rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton variant="text" width={120} height={16} />
                  <Skeleton variant="text" width={60} height={10} />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton variant="text" width={80} height={16} />
                <Skeleton variant="text" width={40} height={10} className="ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton variant="text" width={150} height={32} />
        <div className="glass-card p-6 space-y-6 bg-card border-border shadow-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton variant="circle" width={16} height={16} />
                <Skeleton variant="text" width="30%" height={10} />
              </div>
              <Skeleton variant="text" width="100%" height={24} className="rounded-lg" />
              <Skeleton variant="text" width="70%" height={10} />
              {i < 3 && <div className="border-b border-border/50 pt-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TradeSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-4 md:px-6 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 relative overflow-hidden">
    <div className="lg:col-span-2 space-y-4">
      {/* Asset Info Skeleton */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-20 pointer-events-none" />
        <div className="glass-card p-5 md:p-6 space-y-6 bg-card border-border shadow-xl overflow-hidden">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
              <Skeleton variant="rect" width={56} height={56} className="rounded-2xl shrink-0 md:w-16 md:h-16" />
              <div className="space-y-2 min-w-0 flex-1">
                <Skeleton variant="text" width="90%" height={24} className="md:h-8 max-w-[200px]" />
                <div className="flex gap-2">
                   <Skeleton variant="text" width={50} height={12} />
                   <Skeleton variant="text" width={30} height={12} />
                </div>
              </div>
            </div>
            <div className="text-right space-y-2 shrink-0">
              <Skeleton variant="text" width={100} height={32} className="rounded-xl ml-auto md:w-32 md:h-10" />
              <Skeleton variant="text" width={60} height={16} className="ml-auto" />
            </div>
          </div>
          
          {/* Market Data Grid - Perfectly Orderly */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-5 bg-card-header/30 rounded-2xl border border-border">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5 px-1 md:px-2 md:border-r border-border/30 last:border-0">
                <Skeleton variant="text" width="40%" height={10} />
                <Skeleton variant="text" width="80%" height={20} className="rounded-md md:height-22" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area Skeleton */}
      <div className="glass-card h-[400px] md:h-[500px] bg-card border-border shadow-xl overflow-hidden relative p-0">
        <div className="absolute inset-0 bg-gradient-to-b from-card-header/10 to-transparent" />
        
        {/* Chart Header */}
        <div className="p-4 md:p-6 border-b border-border flex items-center gap-2 md:gap-3 bg-card-header/20">
          <Skeleton variant="rect" width={70} height={28} className="rounded-lg md:w-90" />
          <Skeleton variant="rect" width={70} height={28} className="rounded-lg md:w-90" />
          <div className="w-px h-6 bg-border mx-1 md:mx-2" />
          <div className="flex gap-1.5 overflow-hidden">
             {[1, 2, 3].map(i => (
               <Skeleton key={i} variant="rect" width={28} height={24} className="rounded-md shrink-0 md:w-32 md:h-28" />
             ))}
          </div>
          <div className="flex-1" />
          <Skeleton variant="circle" width={24} height={24} className="shrink-0 md:w-28 md:h-28" />
        </div>

        {/* Fake Chart Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="absolute inset-x-0 h-px bg-border/20" style={{ top: `${i * 18 + 5}%` }} />
           ))}
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="absolute inset-y-0 w-px bg-border/10" style={{ left: `${i * 18 + 5}%` }} />
           ))}
        </div>
        
        {/* Fake Shimmering Chart Pattern */}
        <div className="absolute bottom-16 md:bottom-20 left-6 right-6 md:left-10 md:right-10 h-40 md:h-48 opacity-15 flex items-end gap-1.5 md:gap-2">
           {[...Array(16)].map((_, i) => (
             <div key={i} className="flex-1 space-y-1">
                <div className={`w-full bg-primary/40 rounded-sm animate-pulse`} style={{ height: `${15 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }} />
                <div className="w-0.5 h-3 md:h-4 bg-primary/20 mx-auto rounded-full" />
             </div>
           ))}
        </div>
      </div>
    </div>

    {/* Trading Panel Skeleton */}
    <div className="lg:col-span-1">
      <div className="glass-card bg-card border-border shadow-2xl p-5 md:p-6 space-y-6 md:space-y-7 flex flex-col h-full min-h-[500px] md:min-h-[600px] overflow-hidden">
        {/* Up/Down Tabs */}
        <div className="flex gap-2 p-1 bg-card-header/50 rounded-xl">
          <Skeleton variant="rect" width="50%" height={40} className="rounded-lg md:h-44" />
          <Skeleton variant="rect" width="50%" height={40} className="rounded-lg md:h-44" />
        </div>
        
        <div className="space-y-5 md:space-y-6 flex-1">
          {/* Amount Input */}
          <div className="space-y-2 md:space-y-3">
            <Skeleton variant="text" width={100} height={10} className="ml-1" />
            <div className="p-4 md:p-5 border border-border rounded-2xl bg-card-header/20">
               <Skeleton variant="text" width="50%" height={28} className="md:h-32" />
            </div>
          </div>
          
          <div className="flex justify-between px-1">
            <div className="space-y-1">
               <Skeleton variant="text" width={80} height={10} />
               <Skeleton variant="text" width={50} height={8} />
            </div>
            <Skeleton variant="text" width={30} height={10} className="self-end" />
          </div>

          <div className="p-4 md:p-5 rounded-2xl bg-card-header/30 border border-border flex justify-between items-center">
             <Skeleton variant="text" width="35%" height={12} />
             <Skeleton variant="text" width="25%" height={12} />
          </div>

          <div className="pt-1 md:pt-2">
            <Skeleton variant="rect" width="100%" height={50} className="rounded-2xl md:h-60 shadow-xl bg-primary/10" />
          </div>
        </div>

        {/* Bottom Recent Activity List in Panel */}
        <div className="space-y-4 md:space-y-5 pt-6 md:pt-7 border-t border-border mt-auto">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
               <Skeleton variant="circle" width={14} height={14} />
               <Skeleton variant="text" width={120} height={16} />
            </div>
            <Skeleton variant="text" width={30} height={10} />
          </div>
          <div className="space-y-3 md:space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-1.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rect" width={32} height={32} className="rounded-xl shrink-0" />
                  <div className="space-y-1">
                    <Skeleton variant="text" width={60} height={12} />
                    <Skeleton variant="text" width={40} height={8} />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton variant="text" width={50} height={12} />
                  <Skeleton variant="text" width={30} height={8} className="ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const WalletSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
    {/* Balance Card Skeleton */}
    <div className="relative group">
      <div className="absolute inset-0 bg-primary/10 blur-3xl opacity-20 pointer-events-none" />
      <div className="glass-card bg-card p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border-border shadow-2xl">
        <div className="space-y-6 relative z-10 w-full md:w-1/2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Skeleton variant="circle" width={20} height={20} />
            <Skeleton variant="text" width={120} height={10} />
          </div>
          <Skeleton variant="text" width="100%" height={60} className="rounded-2xl" />
        </div>

        <div className="mt-8 md:mt-0 grid grid-cols-2 gap-4 relative z-10 w-full md:w-auto">
          <Skeleton variant="rect" width={100} height={100} className="rounded-2xl" />
          <Skeleton variant="rect" width={100} height={100} className="rounded-2xl" />
          <Skeleton variant="rect" width="100%" height={100} className="col-span-2 rounded-2xl" />
        </div>
      </div>
    </div>

    {/* Transaction List Skeleton */}
    <div className="glass-card p-0 overflow-hidden border-border shadow-xl">
      <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card-header/40 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" width={22} height={22} />
            <Skeleton variant="text" width={180} height={24} />
          </div>
          <Skeleton variant="text" width={140} height={10} />
        </div>
        <Skeleton variant="rect" width={140} height={40} className="rounded-xl" />
      </div>
      <div className="p-3 sm:p-6 space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between p-4 bg-card-header/30 rounded-2xl border border-border">
            <div className="flex items-center gap-4 w-1/2">
              <Skeleton variant="rect" width={44} height={44} className="rounded-2xl shrink-0" />
              <div className="space-y-2 w-full">
                <Skeleton variant="text" width="70%" height={16} />
                <Skeleton variant="text" width="40%" height={10} />
              </div>
            </div>
            <div className="text-right space-y-2 w-1/3 flex flex-col items-end">
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const HistorySkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-8">
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" width={32} height={32} />
      <Skeleton variant="text" width={250} height={40} />
    </div>
    
    <div className="glass-card p-0 overflow-hidden border-border shadow-xl bg-card">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card-header/40 backdrop-blur-xl">
        <div className="space-y-1">
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="text" width={220} height={12} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
          <Skeleton variant="rect" width={100} height={36} className="rounded-full" />
        </div>
      </div>
      <div className="p-3 sm:p-6 space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center justify-between p-4 bg-card-header/20 rounded-2xl border border-transparent">
            <div className="flex items-center gap-4 w-[60%]">
              <Skeleton variant="rect" width={44} height={44} className="rounded-2xl shrink-0" />
              <div className="space-y-2 w-full">
                <Skeleton variant="text" width="80%" height={16} />
                <Skeleton variant="text" width="40%" height={10} />
              </div>
            </div>
            <div className="text-right space-y-2 w-[30%] flex flex-col items-end">
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="60%" height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const NewsSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-8">
    <div className="space-y-4 text-center">
      <Skeleton variant="rect" width={100} height={24} className="mx-auto rounded-full" />
      <Skeleton variant="text" width="60%" height={48} className="mx-auto" />
      <Skeleton variant="text" width="40%" height={24} className="mx-auto" />
    </div>
    <div className="glass-card h-96" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card h-64" />
      <div className="glass-card h-64" />
    </div>
    <div className="glass-card h-48" />
  </div>
);

export const AdminSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8 relative">
    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
    <div className="flex justify-between items-center relative z-10">
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rect" width={150} height={40} className="rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card h-32 flex flex-col justify-center gap-3 bg-card border-border shadow-lg">
          <Skeleton variant="text" width="40%" height={12} />
          <Skeleton variant="text" width="80%" height={24} />
        </div>
      ))}
    </div>
    <div className="glass-card bg-card border-border shadow-2xl p-0 overflow-hidden relative z-10">
      <div className="flex justify-between border-b border-border p-6 bg-card-header/50">
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="rect" width={100} height={32} className="rounded-lg" />
      </div>
      <div className="p-6 space-y-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton variant="circle" width={44} height={44} className="shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="30%" height={14} />
              <Skeleton variant="text" width="60%" height={10} />
            </div>
            <Skeleton variant="rect" width={80} height={24} className="rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="pt-24 pb-32 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-8 relative">
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
    <div className="md:w-64 space-y-8 relative z-10">
      <div className="space-y-4">
        <Skeleton variant="text" width={100} height={12} className="ml-1" />
        <div className="glass-card p-6 space-y-5 bg-card border-border shadow-lg">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" width={44} height={44} />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={16} />
              <Skeleton variant="text" width={80} height={10} />
            </div>
          </div>
          <div className="pt-4 border-t border-border space-y-3">
            <Skeleton variant="text" width={60} height={10} />
            <Skeleton variant="text" width={150} height={24} className="rounded-lg" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton variant="text" width={100} height={12} className="ml-1" />
        <div className="glass-card p-2 space-y-1 bg-card border-border shadow-md">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} variant="rect" width="100%" height={48} className="rounded-xl opacity-60" />
          ))}
        </div>
      </div>
    </div>
    <div className="flex-1 space-y-6 relative z-10">
      <div className="glass-card h-[450px] bg-card border-border shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <Skeleton variant="text" width={200} height={24} />
        </div>
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton variant="text" width="30%" height={14} />
            <Skeleton variant="rect" width="100%" height={50} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="rect" width="100%" height={50} className="rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="rect" width="100%" height={50} className="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="glass-card h-64 bg-card border-border shadow-xl p-6 space-y-4">
        <Skeleton variant="text" width="40%" height={20} />
        <div className="grid grid-cols-4 gap-4 pt-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rect" width="100%" height={80} className="rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
