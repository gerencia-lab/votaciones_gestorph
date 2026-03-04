
import React, { useState, startTransition } from 'react';
import { AssemblyProvider, useAssembly } from './store/AssemblyContext.tsx';
import { Home } from './components/Home.tsx';
import { VoterView } from './components/VoterView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { ProjectionView } from './components/ProjectionView.tsx';
import { SuperAdminView } from './components/SuperAdminView.tsx';
import { PaymentInfoView } from './components/admin/PaymentInfoView.tsx';
import { ManualView } from './components/ManualView.tsx';
import { LoyaltyView } from './components/admin/LoyaltyView.tsx';

const AppContent: React.FC = () => {
  const getInitialView = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'projection') return 'projection';
    return 'home';
  };
  const [view, setView] = useState<'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual' | 'loyalty'>(getInitialView());
  const { logout, logoutAdmin } = useAssembly();

  const handleBackToHome = () => {
    startTransition(() => {
      if (view === 'voter') logout();
      if (view === 'admin' || view === 'superadmin' || view === 'payments' || view === 'loyalty') logoutAdmin();
      setView('home');
    });
  };

  const handleSetView = (newView: 'home' | 'voter' | 'admin' | 'projection' | 'superadmin' | 'payments' | 'manual' | 'loyalty') => {
    startTransition(() => {
      setView(newView);
    });
  };

  return (
    <div className="relative">
      {view === 'home' && <Home setView={handleSetView} />}
      {view === 'voter' && <VoterView setView={handleSetView} />}
      {view === 'admin' && <AdminView setView={handleSetView} />}
      {view === 'projection' && <ProjectionView setView={handleSetView} />}
      {view === 'superadmin' && <SuperAdminView setView={handleSetView} />}
      {view === 'payments' && <PaymentInfoView setView={handleSetView} />}
      {view === 'manual' && <ManualView setView={handleSetView} />}
      {view === 'loyalty' && <LoyaltyView setView={handleSetView} />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AssemblyProvider>

      <AppContent />
    </AssemblyProvider>
  );
};

export default App;
