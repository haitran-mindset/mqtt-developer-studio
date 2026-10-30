import React, { useState } from 'react';
import { StudioWorkbench } from './app/layout/StudioWorkbench';
import { WelcomeGatewayModal } from './features/welcome/WelcomeGatewayModal';
import { isTauriApp } from './core/mqtt/platform';

export function App() {
  const isDesktop = isTauriApp();
  // For Web visitors: in-memory state for initial edition selection gateway
  const [hasEnteredWebStudio, setHasEnteredWebStudio] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // If already running inside Desktop App (Tauri), skip gateway entirely
  if (isDesktop) {
    return <StudioWorkbench />;
  }

  // Web Edition Gateway: First time visitor screen
  if (!hasEnteredWebStudio) {
    return (
      <WelcomeGatewayModal
        isGateway={true}
        onLaunchWeb={() => setHasEnteredWebStudio(true)}
      />
    );
  }

  // Active Web Studio Workbench + On-Demand Download Desktop Modal
  return (
    <>
      <StudioWorkbench onOpenDownloadModal={() => setShowDownloadModal(true)} />
      <WelcomeGatewayModal
        isGateway={false}
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </>
  );
}

export default App;
