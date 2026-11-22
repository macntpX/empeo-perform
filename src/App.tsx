import React from 'react';
import { HRMProvider, useHRM } from './context/HRMContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { LoginPage } from './components/auth/LoginPage';
import { HRWorkspace } from './components/hr/HRWorkspace';
import { ManagerWorkspace } from './components/manager/ManagerWorkspace';
import { EmployeeWorkspace } from './components/employee/EmployeeWorkspace';

const AppRouter: React.FC = () => {
  const { currentUser } = useHRM();

  if (!currentUser) {
    return <LoginPage />;
  }

  switch (currentUser.role) {
    case 'HR':
      return <HRWorkspace />;
    case 'MANAGER':
      return <ManagerWorkspace />;
    case 'EMPLOYEE':
      return <EmployeeWorkspace />;
    default:
      return <LoginPage />;
  }
};

export function App() {
  return (
    <LanguageProvider>
      <HRMProvider>
        <AppRouter />
      </HRMProvider>
    </LanguageProvider>
  );
}

export default App;
