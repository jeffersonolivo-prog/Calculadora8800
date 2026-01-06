
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Construction, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Settings2,
  Info,
  FileDown
} from 'lucide-react';
import { ModuleType, SupportCondition, CalculationResult, ProfileType } from './types';
import { STANDARD_PROFILES, calculateProperties } from './profiles';
import { jsPDF } from 'jspdf';

const CTA_LINK = "https://wa.me/558189727744";
const G = 0.00980665; // Fator de conversão kgf para kN (9.81 / 1000)

// Componente para renderizar o diagrama do carregamento
const LoadingDiagram: React.FC<{ module: ModuleType; L: number; q: number; P: number; a: number; N: number }> = ({ module, L, q, P, a, N }) => {
  const strokeColor = "#3b82f6"; // blue-500
  const textColor = "#64748b"; // slate-500
  const arrowColor = "#ef4444"; // rose-500

  if (module === ModuleType.BEAM) {
    const posRel = 10 + (Math.min(a, L) / L) * 80;
    return (
      <div className="w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center relative mb-6">
        <svg viewBox="0 0 100 60" className="w-full h-auto max-h-32">
          <line x1="10" y1="35" x2="90" y2="35" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 35 L12 40 L8 40 Z" fill="#1e293b" />
          <path d="M88 35 L92 40 L88 40 Z" fill="#1e293b" />
          <line x1="5" y1="40" x2="15" y2="40" stroke="#1e293b" strokeWidth="1" />
          <line x1="85" y1="40" x2="95" y2="40" stroke="#1e293b" strokeWidth="1" />
          {q > 0 && (
            <g>
              <line x1="10" y1="20" x2="90" y2="20" stroke={strokeColor} strokeWidth="0.5" strokeDasharray="1" opacity="0.5" />
              {[10, 26, 42, 58, 74, 90].map((x) => (
                <path key={x} d={`M${x} 20 L${x} 32 M${x} 32 L${x-1.5} 30 M${x} 32 L${x+1.5} 30`} stroke={strokeColor} strokeWidth="1" fill="none" />
              ))}
              <text x="50" y="15" textAnchor="middle" fontSize="5" fontWeight="bold" fill={strokeColor}>q (kg/m)</text>
            </g>
          )}
          {P > 0 && (
            <g>
              <path d={`M${posRel} 10 L${posRel} 32 M${posRel} 32 L${posRel-2} 28 M${posRel} 32 L${posRel+2} 28`} stroke={arrowColor} strokeWidth="1.5" fill="none" />
              <text x={posRel} y="8" textAnchor="middle" fontSize="6" fontWeight="bold" fill={arrowColor}>P (kg)</text>
            </g>
          )}
          <line x1="10" y1="50" x2="90" y2="50" stroke={textColor} strokeWidth="0.5" />
          <line x1="10" y1="48" x2="10" y2="52" stroke={textColor} strokeWidth="0.5" />
          <line x1="90" y1="48" x2="90" y2="52" stroke={textColor} strokeWidth="0.5" />
          <text x="50" y="56" textAnchor="middle" fontSize="5" fill={textColor}>Vão L (m)</text>
          {P > 0 && (
            <g>
              <line x1="10" y1="44" x2={posRel} y2="44" stroke={textColor} strokeWidth="0.5" strokeDasharray="1" />
              <line x1={posRel} y1="42" x2={posRel} y2="46" stroke={textColor} strokeWidth="0.5" />
              <text x={(10 + posRel) / 2} y="42" textAnchor="middle" fontSize="4" fill={textColor}>a</text>
            </g>
          )}
        </svg>
        <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-mono italic">Diagrama de Viga</div>
      </div>
    );
  }

  // Diagrama para Coluna
  return (
    <div className="w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center relative mb-6">
      <svg viewBox="0 0 60 100" className="w-full h-auto max-h-32">
        <line x1="30" y1="20" x2="30" y2="80" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="80" x2="40" y2="80" stroke="#1e293b" strokeWidth="2" />
        <path d="M22 80 L20 85 M27 80 L25 85 M32 80 L30 85 M37 80 L35 85" stroke="#1e293b" strokeWidth="1" />
        {N > 0 && (
          <g>
            <path d="M30 5 L30 18 M30 18 L27 14 M30 18 L33 14" stroke={arrowColor} strokeWidth="2" fill="none" />
            <text x="35" y="10" textAnchor="start" fontSize="6" fontWeight="bold" fill={arrowColor}>N (kg)</text>
          </g>
        )}
        <line x1="15" y1="20" x2="15" y2="80" stroke={textColor} strokeWidth="0.5" />
        <line x1="13" y1="20" x2="17" y2="20" stroke={textColor} strokeWidth="0.5" />
        <line x1="13" y1="80" x2="17" y2="80" stroke={textColor} strokeWidth="0.5" />
        <text x="10" y="50" textAnchor="middle" fontSize="6" fill={textColor} transform="rotate(-90, 10, 50)">Altura H (m)</text>
      </svg>
      <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-mono italic">Diagrama de Pilar</div>
    </div>
  );
};

// Componente para renderizar o diagrama do perfil
const ProfileDiagram: React.FC<{ type: ProfileType; dims: Record<string, number> }> = ({ type, dims }) => {
  const strokeColor = "#3b82f6";
  const textColor = "#64748b";
  const renderDiagram = () => {
    switch (type) {
      case ProfileType.SQUARE_TUBE:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke={strokeColor} strokeWidth="2" />
            <rect x="25" y="25" width="50" height="50" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="2" />
            <text x="50" y="15" textAnchor="middle" fontSize="8" fill={textColor}>b</text>
            <text x="85" y="50" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(90, 85, 50)">h</text>
            <text x="22" y="55" textAnchor="middle" fontSize="6" fill={textColor}>t</text>
          </svg>
        );
      case ProfileType.ANGLE:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20 20 V80 H80 V70 H30 V20 Z" fill="none" stroke={strokeColor} strokeWidth="2" />
            <text x="50" y="90" textAnchor="middle" fontSize="8" fill={textColor}>b</text>
            <text x="15" y="50" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(-90, 15, 50)">h</text>
            <text x="25" y="25" textAnchor="middle" fontSize="6" fill={textColor}>t</text>
          </svg>
        );
      case ProfileType.U_CHANNEL:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M70 20 H30 V80 H70 V70 H40 V30 H70 Z" fill="none" stroke={strokeColor} strokeWidth="2" />
            <text x="50" y="15" textAnchor="middle" fontSize="8" fill={textColor}>b</text>
            <text x="25" y="50" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(-90, 25, 50)">h</text>
            <text x="35" y="50" textAnchor="middle" fontSize="6" fill={textColor}>tw</text>
            <text x="55" y="75" textAnchor="middle" fontSize="6" fill={textColor}>tf</text>
          </svg>
        );
      case ProfileType.STIFFENED_U:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M60 30 H70 V20 H30 V80 H70 V70 H60" fill="none" stroke={strokeColor} strokeWidth="2" />
            <text x="50" y="15" textAnchor="middle" fontSize="8" fill={textColor}>b</text>
            <text x="25" y="50" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(-90, 25, 50)">h</text>
            <text x="65" y="25" textAnchor="middle" fontSize="6" fill={textColor}>t</text>
            <text x="75" y="25" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(90, 75, 25)">d</text>
          </svg>
        );
      case ProfileType.IW_BEAM:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M20 20 H80 V30 H55 V70 H80 V80 H20 V70 H45 V30 H20 Z" fill="none" stroke={strokeColor} strokeWidth="2" />
            <text x="50" y="15" textAnchor="middle" fontSize="8" fill={textColor}>b</text>
            <text x="15" y="50" textAnchor="middle" fontSize="8" fill={textColor} transform="rotate(-90, 15, 50)">h</text>
            <text x="50" y="50" textAnchor="middle" fontSize="6" fill={textColor}>tw</text>
            <text x="30" y="25" textAnchor="middle" fontSize="6" fill={textColor}>tf</text>
          </svg>
        );
      default:
        return null;
    }
  };
  return (
    <div className="w-full aspect-square bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-center relative">
      <div className="w-32 h-32">{renderDiagram()}</div>
      <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 font-mono">Esquema Dimensional</div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.BEAM);
  
  const [profileType, setProfileType] = useState<ProfileType>(ProfileType.SQUARE_TUBE);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(STANDARD_PROFILES[ProfileType.SQUARE_TUBE][0].id);
  const [customDims, setCustomDims] = useState<Record<string, number>>(STANDARD_PROFILES[ProfileType.SQUARE_TUBE][0].dimensions);

  // Parâmetros em kg e m
  const [L, setL] = useState<number>(3.0);
  const [E, setE] = useState<number>(200000);
  const [Qkg, setQkg] = useState<number>(500); // kg/m
  const [Pkg, setPkg] = useState<number>(0);   // kg
  const [posA, setPosA] = useState<number>(1.5); 
  const [axialNkg, setAxialNkg] = useState<number>(5000); // kg
  const [K, setK] = useState<number>(SupportCondition.PINNED_PINNED);

  const handleProfileTypeChange = (type: ProfileType) => {
    setProfileType(type);
    const first = STANDARD_PROFILES[type][0];
    setSelectedProfileId(first.id);
    setCustomDims(first.dimensions);
  };

  const handleStandardChange = (id: string) => {
    setSelectedProfileId(id);
    const profile = STANDARD_PROFILES[profileType].find(p => p.id === id);
    if (profile) setCustomDims(profile.dimensions);
  };

  const handleDimChange = (key: string, val: number) => {
    setCustomDims(prev => ({ ...prev, [key]: val }));
    setSelectedProfileId('custom');
  };

  const { ix, rmin, area } = useMemo(() => calculateProperties(profileType, customDims), [profileType, customDims]);

  // Cálculos convertendo kg para kN
  const beamResult = useMemo((): CalculationResult => {
    const Q_kN = Qkg * G;
    const P_kN = Pkg * G;

    const deltaQ = (5 * Q_kN * Math.pow(L, 4) * 100000) / (384 * E * ix);
    let deltaP = 0;
    if (P_kN > 0) {
      const a = Math.min(posA, L);
      const b_calc = a < L/2 ? a : L - a;
      deltaP = (P_kN * b_calc * Math.pow(Math.pow(L, 2) - Math.pow(b_calc, 2), 1.5) * 10000000) / (9 * Math.sqrt(3) * E * ix * L);
    }

    const deltaTotal = deltaQ + deltaP;
    const limit = (L * 100) / 250;
    const isApproved = deltaTotal < limit;
    
    return {
      isApproved,
      value: deltaTotal,
      limit,
      message: isApproved ? "APROVADO" : "REPROVADO",
      recommendation: isApproved 
        ? "Flecha total dentro do limite normativo L/250." 
        : "A estrutura excedeu o limite de serviço. Aumente o perfil ou reduza o vão."
    };
  }, [L, E, ix, Qkg, Pkg, posA]);

  const columnResult = useMemo((): CalculationResult => {
    const lambda = (K * L * 100) / rmin;
    const limit = 200;
    const isApproved = lambda < limit;
    return {
      isApproved,
      value: lambda,
      limit,
      message: isApproved ? "OK" : "RISCO DE FLAMBAGEM",
      recommendation: isApproved 
        ? "Índice de esbeltez adequado (λ < 200)." 
        : "O perfil é muito esbelto para esta altura. Aumente o raio de giração ou adicione travamentos."
    };
  }, [L, rmin, K, axialNkg]);

  const activeResult = activeModule === ModuleType.BEAM ? beamResult : columnResult;

  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Memorial de Cálculo Estrutural - NBR 8800', margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    // Seção: Identificação
    doc.setFont('helvetica', 'bold');
    doc.text(`Módulo: ${activeModule === ModuleType.BEAM ? 'Verificação de Viga (Flecha)' : 'Verificação de Coluna (Flambagem)'}`, margin, y);
    y += 10;

    // Seção: Perfil
    doc.setFontSize(12);
    doc.text('1. Dados do Perfil e Propriedades de Seção', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo de Perfil: ${profileType.replace('_', ' ').toUpperCase()}`, margin + 5, y); y += 5;
    doc.text(`Bitola: ${selectedProfileId === 'custom' ? 'Personalizada' : (STANDARD_PROFILES[profileType].find(p => p.id === selectedProfileId)?.name || 'N/A')}`, margin + 5, y); y += 5;
    
    const dimsStr = Object.entries(customDims).map(([k, v]) => `${k}=${v}cm`).join(', ');
    doc.text(`Dimensões: ${dimsStr}`, margin + 5, y); y += 5;
    doc.text(`Área de Seção: ${area.toFixed(2)} cm²`, margin + 5, y); y += 5;
    doc.text(`Inércia Ix: ${ix.toFixed(2)} cm⁴`, margin + 5, y); y += 5;
    doc.text(`Raio de Giração rmin: ${rmin.toFixed(3)} cm`, margin + 5, y); y += 10;

    // Seção: Geometria e Cargas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Geometria e Carregamento', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${activeModule === ModuleType.BEAM ? 'Vão Livre (L)' : 'Altura (H)'}: ${L.toFixed(2)} m`, margin + 5, y); y += 5;
    doc.text(`Módulo de Elasticidade (E): ${E} MPa`, margin + 5, y); y += 5;
    
    if (activeModule === ModuleType.BEAM) {
      doc.text(`Carga Distribuída (q): ${Qkg.toFixed(2)} kg/m`, margin + 5, y); y += 5;
      doc.text(`Carga Concentrada (P): ${Pkg.toFixed(2)} kg`, margin + 5, y); y += 5;
      doc.text(`Posição da Carga P (a): ${posA.toFixed(2)} m`, margin + 5, y); y += 5;
    } else {
      doc.text(`Força Axial de Compressão (N): ${axialNkg.toFixed(2)} kg`, margin + 5, y); y += 5;
      doc.text(`Fator de Comprimento Efetivo (K): ${K}`, margin + 5, y); y += 5;
    }
    y += 10;

    // Seção: Verificação
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Verificação de Segurança', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Valor Calculado (${activeModule === ModuleType.BEAM ? 'Flecha cm' : 'Esbeltez λ'}): ${activeResult.value.toFixed(2)}`, margin + 5, y); y += 5;
    doc.text(`Limite Normativo NBR 8800: ${activeResult.limit.toFixed(2)}`, margin + 5, y); y += 10;

    // Resultado Final
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const color = activeResult.isApproved ? [16, 185, 129] : [244, 63, 94]; // emerald-500 : rose-500
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`STATUS FINAL: ${activeResult.message}`, margin, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Recomendação: ${activeResult.recommendation}`, margin, y, { maxWidth: 170 });
    y += 20;

    // CTA
    doc.setTextColor(59, 130, 246); // blue-500
    doc.setFontSize(11);
    doc.text('Dúvidas no dimensionamento? Fale com o especialista no WhatsApp:', margin, y);
    y += 7;
    doc.text('55 (81) 8972-7744', margin, y);

    // Save
    doc.save(`Memorial_Calculo_${activeModule}_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
      <header className="bg-slate-900 text-white py-8 px-4 shadow-xl mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/20">
              <Construction className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Calculadora Estrutural NBR 8800</h1>
              <p className="text-slate-400 text-sm">Dimensionamento de Precisão para SolidWorks</p>
            </div>
          </div>
          <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button 
              onClick={() => setActiveModule(ModuleType.BEAM)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeModule === ModuleType.BEAM ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Viga (Flecha)
            </button>
            <button 
              onClick={() => setActiveModule(ModuleType.COLUMN)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeModule === ModuleType.COLUMN ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Coluna (Flambagem)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Seção 1: Perfil */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 mb-6">
              <Settings2 className="w-5 h-5 text-blue-600" />
              1. Especificação do Perfil
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Tipo de Perfil</label>
                    <select 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={profileType}
                      onChange={(e) => handleProfileTypeChange(e.target.value as ProfileType)}
                    >
                      <option value={ProfileType.SQUARE_TUBE}>Tubo Quadrado/Retangular</option>
                      <option value={ProfileType.ANGLE}>Cantoneira (L)</option>
                      <option value={ProfileType.U_CHANNEL}>Perfil U</option>
                      <option value={ProfileType.STIFFENED_U}>Perfil U Enrijecido</option>
                      <option value={ProfileType.IW_BEAM}>Perfil I / W</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Bitola Padrão</label>
                    <select 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedProfileId}
                      onChange={(e) => handleStandardChange(e.target.value)}
                    >
                      {STANDARD_PROFILES[profileType].map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="custom">-- Personalizado --</option>
                    </select>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Dimensões Reais (cm)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(customDims).map(([dim, val]) => (
                      <div key={dim} className="flex items-center gap-2">
                        <label className="w-8 text-[10px] font-black text-slate-400 uppercase text-left">{dim}</label>
                        <DimensionInput 
                          value={val}
                          onChange={(newVal) => handleDimChange(dim, newVal)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <ProfileDiagram type={profileType} dims={customDims} />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Inércia Ix (cm⁴)</span>
                    <span className="text-sm font-bold text-slate-700">{ix.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Raio Giração (cm)</span>
                    <span className="text-sm font-bold text-slate-700">{rmin.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Carregamento */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
              <Calculator className="w-5 h-5 text-blue-600" />
              2. Geometria e Carregamento
            </h2>
            <LoadingDiagram module={activeModule} L={L} q={Qkg} P={Pkg} a={posA} N={axialNkg} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <InputField label={activeModule === ModuleType.BEAM ? "Vão Livre (L)" : "Altura da Coluna (H)"} unit="m" value={L} onChange={setL} />
              <InputField label="Módulo Elasticidade (E)" unit="MPa" value={E} onChange={setE} />
              {activeModule === ModuleType.BEAM ? (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <InputField label="Carga Distribuída (q)" unit="kg/m" value={Qkg} onChange={setQkg} />
                  <InputField label="Carga Concentrada (P)" unit="kg" value={Pkg} onChange={setPkg} />
                  <InputField label="Posição Carga (a)" unit="m" value={posA} onChange={setPosA} />
                </div>
              ) : (
                <>
                  <InputField label="Compressão Axial (N)" unit="kg" value={axialNkg} onChange={setAxialNkg} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Condição de Apoio (K)</label>
                    <select 
                      value={K} 
                      onChange={(e) => setK(parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      <option value={SupportCondition.FIXED_FIXED}>Engastado-Engastado (K=0.5)</option>
                      <option value={SupportCondition.FIXED_PINNED}>Engastado-Pino (K=0.7)</option>
                      <option value={SupportCondition.PINNED_PINNED}>Pino-Pino (K=1.0)</option>
                      <option value={SupportCondition.FIXED_FREE}>Engastado-Livre (K=2.0)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Coluna Direita: Resultados */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 sticky top-8">
            <h2 className="text-lg font-bold mb-8 text-center text-slate-800 uppercase tracking-widest">Status NBR 8800</h2>
            <div className="flex flex-col items-center gap-8">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center border-[10px] shadow-inner transition-all duration-500 ${activeResult.isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                {activeResult.isApproved ? <CheckCircle2 className="w-14 h-14" /> : <AlertCircle className="w-14 h-14" />}
              </div>
              <div className="text-center space-y-3">
                <div className={`text-3xl font-black tracking-tighter ${activeResult.isApproved ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {activeResult.message}
                </div>
                <div className="flex items-start gap-2 text-slate-500 text-xs text-left max-w-[240px] bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                  <p>{activeResult.recommendation}</p>
                </div>
              </div>
              <div className="w-full grid grid-cols-1 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Calculado</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-bold text-slate-800">{activeResult.value.toFixed(2)}</span>
                    <span className="text-[10px] ml-1 text-slate-400 font-bold uppercase">{activeModule === ModuleType.BEAM ? 'cm' : 'λ'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Limite NBR</span>
                  <div className="text-right">
                    <span className="text-lg font-mono font-bold text-slate-600">{activeResult.limit.toFixed(2)}</span>
                    <span className="text-[10px] ml-1 text-slate-400 font-bold uppercase">{activeModule === ModuleType.BEAM ? 'cm' : 'λ'}</span>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-3 mt-4">
                <button 
                  onClick={exportPDF}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all border border-slate-200 active:scale-95"
                >
                  <FileDown className="w-4 h-4" />
                  Exportar Memorial (PDF)
                </button>

                {!activeResult.isApproved && (
                  <div className="w-full bg-slate-900 rounded-2xl p-6 shadow-2xl text-white border-b-4 border-blue-600">
                    <h3 className="font-bold text-base mb-2">Projeto Reprovado?</h3>
                    <p className="text-slate-400 text-[11px] mb-6 leading-relaxed">
                      Dimensionar estruturas metálicas exige precisão. Evite erros caros e fale agora mesmo com um de nossos especialistas.
                    </p>
                    <a href={CTA_LINK} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-500 transition-all shadow-lg active:scale-95">
                      Falar com especialista
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-16 px-4 text-center pb-12 border-t border-slate-200 pt-8 opacity-60">
        <p className="text-slate-400 text-[10px] leading-relaxed max-w-2xl mx-auto uppercase tracking-widest font-bold">
          Cálculos em conformidade com as recomendações de serviço e esbeltez da NBR 8800:2008. 
          As entradas em kg são convertidas para kN usando g = 9,81 m/s². 
          A validação por um profissional habilitado é indispensável.
        </p>
      </footer>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  unit: string;
  value: number;
  onChange: (val: number) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, unit, value, onChange }) => {
  const [displayValue, setDisplayValue] = useState<string>(value.toString());

  // Atualiza o valor visual se o valor real mudar externamente (ex: trocar de perfil)
  useEffect(() => {
    if (parseFloat(displayValue) !== value) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  return (
    <div className="space-y-1.5 flex-grow">
      <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">{label}</label>
      <div className="relative">
        <input 
          type="text"
          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value.replace(',', '.');
            if (val === '' || val === '-' || val === '.' || /^-?\d*\.?\d*$/.test(val)) {
              setDisplayValue(val);
              const parsed = parseFloat(val);
              if (!isNaN(parsed)) {
                onChange(parsed);
              } else {
                onChange(0);
              }
            }
          }}
          onBlur={() => {
            // No blur, limpa formatos inválidos e garante sincronia com o estado numérico
            setDisplayValue(value.toString());
          }}
        />
        <span className="absolute right-2 top-2.5 text-[10px] font-bold text-slate-300 uppercase pointer-events-none">{unit}</span>
      </div>
    </div>
  );
};

interface DimensionInputProps {
  value: number;
  onChange: (val: number) => void;
}

const DimensionInput: React.FC<DimensionInputProps> = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState<string>(value.toString());

  useEffect(() => {
    if (parseFloat(displayValue) !== value) {
      setDisplayValue(value.toString());
    }
  }, [value]);

  return (
    <input 
      type="text"
      className="flex-grow p-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-center outline-none focus:ring-1 focus:ring-blue-400"
      value={displayValue}
      onChange={(e) => {
        const val = e.target.value.replace(',', '.');
        if (val === '' || val === '.' || /^\d*\.?\d*$/.test(val)) {
          setDisplayValue(val);
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            onChange(parsed);
          } else {
            onChange(0);
          }
        }
      }}
      onBlur={() => setDisplayValue(value.toString())}
    />
  );
};

export default App;
