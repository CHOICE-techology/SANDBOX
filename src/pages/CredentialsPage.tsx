import React, { useState, useEffect } from 'react';

import { useWallet } from '@/contexts/WalletContext';
import { VerifiableCredential } from '@/types';
import { addCredential } from '@/services/storageService';
import { mockUploadToIPFS, mockVerifyPhysicalDocument } from '@/services/cryptoService';
import { analyzeWalletHistory } from '@/services/blockchainService';
import { grantWalletAnalysisReward } from '@/services/rewardService';

import { ChoiceButton } from '@/components/ChoiceButton';

import { SocialReputationHub } from '@/components/social/SocialReputationHub';
import {
  FileText, Upload, FileCheck,
  GraduationCap, Award, BadgeCheck, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CredentialsPage: React.FC = () => {
  const { userIdentity: identity, updateIdentity: onUpdateIdentity } = useWallet();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'Diploma' | 'Certification' | 'Award' | 'ID'>('Diploma');
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);



  if (!identity) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h2 className="text-xl font-bold text-foreground">Connect your CHOICE ID to access credentials.</h2>
      <p className="text-muted-foreground text-sm max-w-sm">Here's how it works:</p>
    </div>
  );



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) setSelectedFile(event.target.files[0]);
  };

  const verifyPhysicalDocument = async () => {
    if (!selectedFile) return;
    setIsVerifyingDoc(true);
    try {
      const result = await mockVerifyPhysicalDocument(selectedFile);
      if (result.verified) {
        const docVC: VerifiableCredential = {
          id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
          type: ['VerifiableCredential', 'PhysicalCredential'],
          issuer: 'did:web:choice.love/verifier',
          issuanceDate: new Date().toISOString(),
          credentialSubject: { id: identity.did, documentType: docType, fileName: selectedFile.name, verificationStatus: 'Verified', issuer: result.issuer }
        };
        await mockUploadToIPFS(docVC);
        const newIdentity = await addCredential(identity, docVC);
        await onUpdateIdentity(newIdentity);
        setSelectedFile(null);
      }
    } catch (e) { console.error('Doc verification failed', e); }
    finally { setIsVerifyingDoc(false); }
  };

  const physicalCredentials = identity.credentials.filter((vc: VerifiableCredential) => vc.type.includes('PhysicalCredential'));

  const docTypeIconComponents: Record<string, React.ElementType> = {
    Diploma: GraduationCap, Certification: BadgeCheck, Award: Award, ID: CreditCard
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Narrative header */}
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-1 tracking-tighter">Identity Profile</h1>
        <p className="text-muted-foreground text-sm font-medium">
          On-chain activity → Real-world proof → Social reputation → Trust score
        </p>
      </header>

      {/* ═══════════════ 1. WALLET HISTORY ANALYSIS ═══════════════ */}


      {/* ═══════════════ 2. REAL-WORLD PROOFS ═══════════════ */}
      <section className="bg-card border border-border rounded-2xl p-5 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <FileCheck size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-foreground tracking-tight leading-tight">Real-World Proofs</h2>
              <p className="text-muted-foreground text-xs font-medium mt-0.5">Upload and verify physical documents to strengthen your identity</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 hidden sm:inline-flex">+20 pts</span>
        </div>

        {/* Document type selector */}
        <div className="mb-5">
          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-2.5">Document Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['Diploma', 'Certification', 'Award', 'ID'] as const).map(type => {
              const IconComp = docTypeIconComponents[type];
              return (
                <button key={type} onClick={() => setDocType(type)}
                  className={cn('px-4 py-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5',
                    docType === type
                      ? 'bg-foreground text-background border-foreground shadow-md'
                      : 'bg-muted border-border text-muted-foreground hover:bg-muted/70 hover:border-primary/30')}>
                  <IconComp size={16} /> {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload area */}
        <div className="relative group mb-5">
          <div className="bg-muted border-2 border-dashed border-border rounded-xl p-6 md:p-8 text-center hover:bg-muted/70 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden">
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept=".pdf,.jpg,.png" />
            {selectedFile ? (
              <div className="flex items-center gap-4 text-primary animate-fade-in justify-center">
                <div className="p-3 bg-primary/10 rounded-xl"><FileText size={24} /></div>
                <div className="text-left min-w-0">
                  <span className="font-black text-sm tracking-tight block truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground font-medium">Type: <strong className="text-foreground">{docType}</strong></span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-3 bg-card rounded-xl shadow-sm"><Upload size={28} /></div>
                <div className="text-center">
                  <span className="font-bold text-sm tracking-tight block">Drop file here or click to upload</span>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Supports PDF, JPG, PNG</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verify button */}
        <ChoiceButton
          onClick={verifyPhysicalDocument}
          isLoading={isVerifyingDoc}
          disabled={!selectedFile}
          className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-glow-primary"
        >
          Verify & Mint Credential
        </ChoiceButton>

        {/* Verified documents list */}
        {physicalCredentials.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-3">Verified Documents</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {physicalCredentials.map((vc: VerifiableCredential) => {
                const dtype = vc.credentialSubject.documentType as string;
                const fname = vc.credentialSubject.fileName as string;
                const IconComp = docTypeIconComponents[dtype] || FileText;
                return (
                  <div key={vc.id} className="bg-muted border border-border rounded-xl p-3.5 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <IconComp size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground text-sm">{dtype}</span>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-500/20">Verified</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{fname}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════ 3. SOCIAL REPUTATION HUB ═══════════════ */}
      <SocialReputationHub identity={identity} onUpdateIdentity={onUpdateIdentity} />
    </div>
  );
};

export default CredentialsPage;
