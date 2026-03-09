import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
    collection, doc, updateDoc, addDoc, deleteDoc,
    onSnapshot, query, where, getDocs, writeBatch, getDoc, setDoc, increment, DocumentSnapshot
} from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, auth, storage, functions } from '../firebaseConfig';
import { GoogleGenAI } from "@google/genai";
import {
    Copropiedad, Asamblea, Unidad, Asambleista, Pregunta, Voto,
    PHAdmin, SuperAdmin, AssemblyStatus, PlantillaPregunta, LoyaltyRules, LoyaltyTransaction, LoyaltyStatus
} from '../types';
import { PRODUCTION_DOMAIN } from '../constants';

// Workaround for module resolution issues
const { signInAnonymously } = firebaseAuth as any;

// Utility for Password Hashing
const hashString = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Helper para obtener variables de entorno de manera segura dentro del Contexto.
 */
const getContextEnv = (key: string, fallback: string): string => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) { }

    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) { }

    return fallback;
};

interface AssemblyContextType {
    isDbReady: boolean;
    copropiedades: Copropiedad[];
    asambleas: Asamblea[];
    unidades: Unidad[];
    asambleistas: Asambleista[];
    preguntas: Pregunta[];
    votos: Voto[];
    phAdmins: PHAdmin[];
    superAdmins: SuperAdmin[];
    plantillas: PlantillaPregunta[];
    loyaltyRules: LoyaltyRules;
    loyaltyTransactions: LoyaltyTransaction[];

    selectedCopropiedadId: string | null;
    selectedAsambleaId: string | null;
    currentUser: Asambleista | null;
    currentAdmin: PHAdmin | null;
    currentSuperAdmin: SuperAdmin | null;
    activeQuestion: Pregunta | undefined;
    sessionStatus: AssemblyStatus;
    aiStatus: string;

    // Actions
    loginByToken: (token: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    loginAdmin: (e: string, p: string) => Promise<{ success: boolean; message?: string }>;
    logoutAdmin: () => void;
    loginSuperAdmin: (e: string, p: string) => Promise<{ success: boolean; message?: string }>;
    logoutSuperAdmin: () => void;
    registerAdmin: (data: any) => Promise<{ success: boolean; message?: string }>;
    recoverEmailByPhone: (phone: string) => Promise<string | null>;

    selectCopropiedad: (id: string | null) => void;
    selectAsamblea: (id: string | null) => void;

    addCopropiedad: (data: any) => Promise<void>;
    updateCopropiedad: (id: string, data: any) => Promise<void>;
    deleteCopropiedad: (id: string) => Promise<void>;

    createAsamblea: (data: any) => Promise<void>;
    updateAsamblea: (id: string, data: any) => Promise<void>;
    deleteAsamblea: (id: string) => Promise<void>;
    startAssembly: (id: string) => Promise<void>;
    endAssembly: (id: string) => Promise<void>;
    confirmPayment: (id: string) => Promise<void>;

    updateAdmin: (id: string, data: any) => Promise<void>;
    deleteAdmin: (id: string) => Promise<void>;

    registerSuperAdmin: (data: any) => Promise<void>;
    updateSuperAdmin: (id: string, data: any) => Promise<void>;
    deleteSuperAdmin: (id: string) => Promise<void>;
    updateLoyaltyRules: (rules: LoyaltyRules) => Promise<void>;
    addManualPoints: (adminId: string, amount: number, description: string) => Promise<void>;
    approveLoyaltyTransaction: (id: string) => Promise<void>;
    rejectLoyaltyTransaction: (id: string, reason: string) => Promise<void>;

    addUnit: (data: any) => Promise<void>;
    updateUnit: (id: string, data: any) => Promise<void>;
    deleteUnit: (id: string) => Promise<void>;
    bulkAddUnits: (units: any[]) => Promise<void>;
    regenerateUnitToken: (id: string) => Promise<void>;
    getTotalBuildingCoefficient: (copropiedadId: string) => number;
    sendEmailInvitation: (unitId: string) => Promise<{ success: boolean; message?: string }>;
    registerBulkEmailSent: (asambleaId: string) => Promise<void>;

    addAsambleista: (data: any) => Promise<void>;
    deleteAsambleista: (id: string) => Promise<void>;
    toggleAttendance: (id: string) => Promise<void>;
    updateBatchAttendance: (ids: string[], status: boolean) => Promise<void>;
    registerProxy: (data: any) => Promise<void>;
    unlinkProxyUnits: (proxyId: string, unitIds: string[]) => Promise<void>;
    addProxyUnits: (proxyId: string, unitIds: string[]) => Promise<void>;
    getAsambleistaByUnit: (unitId: string) => Asambleista | undefined;
    generateMassCredentials: () => Promise<{ created: number, updated: number }>;
    clearMassCredentials: () => Promise<{ deleted: number }>;

    addQuestion: (texto: string, opciones: string[], tiempo: number, esMultiple: boolean) => Promise<void>;
    updateQuestion: (id: string, texto: string, opciones: string[], tiempo: number, esMultiple: boolean) => Promise<void>;
    openQuestion: (id: string) => Promise<void>;
    closeQuestion: (id: string) => Promise<void>;
    reopenQuestion: (id: string, tiempo: number) => Promise<void>;
    submitVote: (qId: string, asmId: string, selection: string[]) => Promise<void>;
    calculateResults: (qId: string, type: 'coeficiente' | 'nominal') => any[];
    reorderQuestions: (orderedIds: string[]) => Promise<void>;

    getVoterCoefficient: (voter: Asambleista | null) => number;
    getVoterUnidades: (voter: Asambleista | null) => Unidad[];
    initializeDatabase: () => Promise<void>;

    generateAssemblySummary: (audioFile: File) => Promise<void>;
    saveManualSummary: (text: string) => Promise<void>;
}

const AssemblyContext = createContext<AssemblyContextType | undefined>(undefined);

const safeParse = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

const normalizeDoc = (doc: any) => ({ ...doc.data(), id: doc.id });

const DEFAULT_LOYALTY_RULES: LoyaltyRules = {
    pointsRegister: 50,
    pointsCreateBuilding: 20,
    pointsCreateAssembly: 10,
    pointsUploadLegal: 30,
    pointsServiceBasic: 100,
    pointsServicePremium: 200,
    pointsServiceAI: 50
};

const LOYALTY_DESCRIPTIONS: Record<string, string> = {
    pointsRegister: 'Bienvenida a la Plataforma',
    pointsCreateBuilding: 'Creación de Copropiedad',
    pointsCreateAssembly: 'Creación de Asamblea',
    pointsUploadLegal: 'Carga de Representación Legal',
    pointsServiceBasic: 'Compra de Servicio Básico',
    pointsServicePremium: 'Compra de Servicio Premium',
    pointsServiceAI: 'Adquisición Acta IA'
};

export const AssemblyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDbReady, setIsDbReady] = useState(false);

    const [copropiedades, setCopropiedades] = useState<Copropiedad[]>([]);
    const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
    const [unidades, setUnidades] = useState<Unidad[]>([]);
    const [asambleistas, setAsambleistas] = useState<Asambleista[]>([]);
    const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
    const [votos, setVotos] = useState<Voto[]>([]);
    const [phAdmins, setPhAdmins] = useState<PHAdmin[]>([]);
    const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaPregunta[]>([]);
    const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRules>(DEFAULT_LOYALTY_RULES);
    const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);

    const [selectedCopropiedadId, setSelectedCopropiedadId] = useState<string | null>(null);
    const [selectedAsambleaId, setSelectedAsambleaId] = useState<string | null>(null);
    const [aiStatus, setAiStatus] = useState<string>('');

    const [currentUser, setCurrentUser] = useState<Asambleista | null>(null);
    const [currentAdmin, setCurrentAdmin] = useState<PHAdmin | null>(null);
    const [currentSuperAdmin, setCurrentSuperAdmin] = useState<SuperAdmin | null>(null);

    const activeQuestion = preguntas.find(p => p.asambleaId === selectedAsambleaId && p.status === 'ABIERTA');
    const sessionStatus = asambleas.find(a => a.id === selectedAsambleaId)?.status || 'PROGRAMADA';

    useEffect(() => {
        const checkRestoreSessions = async () => {
            // Restaurar sesión de Admin o Super Admin
            const savedAdmin = safeParse('ph_admin_session');
            if (savedAdmin) {
                setCurrentAdmin(savedAdmin);
                setSelectedCopropiedadId(localStorage.getItem('ph_selected_cp'));
                setSelectedAsambleaId(localStorage.getItem('ph_selected_as'));
            }
            const savedSuper = safeParse('ph_super_session');
            if (savedSuper) setCurrentSuperAdmin(savedSuper);

            // Restaurar sesión de Votante (CON VALIDACIÓN DE ESTADO)
            const savedVoter = safeParse('ph_voter_session');
            if (savedVoter) {
                // Verificamos si la asamblea del votante sigue activa antes de restaurar
                try {
                    const asmSnap = await getDoc(doc(db, "asambleas", savedVoter.asambleaId));
                    if (asmSnap.exists() && asmSnap.data().status !== 'FINALIZADA') {
                        setCurrentUser(savedVoter);
                        setSelectedAsambleaId(savedVoter.asambleaId);
                        setSelectedCopropiedadId(savedVoter.copropiedadId);
                    } else {
                        // Si está finalizada, limpiamos el rastro
                        localStorage.removeItem('ph_voter_session');
                    }
                } catch (e) {
                    console.warn("Error verificando sesión persistente", e);
                }
            }
        };

        checkRestoreSessions();
    }, []);

    useEffect(() => {
        let loaded = 0;
        const checkReady = () => { loaded++; if (loaded >= 6) setIsDbReady(true); };

        const unsub1 = onSnapshot(collection(db, "phAdmins"), s => { setPhAdmins(s.docs.map(normalizeDoc)); checkReady(); });

        const unsub2 = onSnapshot(collection(db, "copropiedades"), s => {
            const buildings = s.docs.map(d => {
                const data = d.data();
                const ids = data.adminIds || (data.adminId ? [data.adminId] : []);
                return { ...data, id: d.id, adminIds: ids } as Copropiedad;
            });
            setCopropiedades(buildings);
            checkReady();
        });

        const unsub3 = onSnapshot(collection(db, "asambleas"), s => { setAsambleas(s.docs.map(normalizeDoc)); checkReady(); });
        const unsub4 = onSnapshot(collection(db, "unidades"), s => {
            setUnidades(s.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    id: d.id,
                    coefficient: Number(data.coeficiente || data.coefficient || 0),
                    coeficiente: Number(data.coeficiente || data.coefficient || 0)
                } as Unidad;
            }));
            checkReady();
        });
        const unsub5 = onSnapshot(collection(db, "asambleistas"), s => { setAsambleistas(s.docs.map(normalizeDoc)); checkReady(); });
        const unsub6 = onSnapshot(collection(db, "preguntas"), s => { setPreguntas(s.docs.map(normalizeDoc)); checkReady(); });
        const unsub7 = onSnapshot(collection(db, "votos"), s => setVotos(s.docs.map(normalizeDoc)));
        const unsub8 = onSnapshot(collection(db, "plantillasPreguntas"), s => setPlantillas(s.docs.map(normalizeDoc)));
        const unsub9 = onSnapshot(collection(db, "superAdmins"), s => setSuperAdmins(s.docs.map(normalizeDoc)));

        const loyaltyRef = doc(db, "systemSettings", "loyalty");
        const unsub10 = onSnapshot(loyaltyRef, (snapshot) => {
            if (snapshot.exists()) {
                setLoyaltyRules(snapshot.data() as LoyaltyRules);
            } else {
                setDoc(loyaltyRef, DEFAULT_LOYALTY_RULES).catch(console.error);
            }
        });

        const unsub11 = onSnapshot(collection(db, "loyaltyTransactions"), s => {
            setLoyaltyTransactions(s.docs.map(normalizeDoc).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        });

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsub10(); unsub11(); };
    }, []);

    // --- LOYALTY SYSTEM ---
    const assignLoyaltyPoints = async (adminIds: string[] | string, action: keyof LoyaltyRules) => {
        const ids = Array.isArray(adminIds) ? adminIds : [adminIds];
        const pointsToAdd = loyaltyRules[action] || 0;
        if (pointsToAdd === 0) return;

        const batch = writeBatch(db);
        for (const adminId of ids) {
            const transRef = doc(collection(db, "loyaltyTransactions"));
            batch.set(transRef, {
                adminId: adminId,
                amount: pointsToAdd,
                reason: action,
                description: LOYALTY_DESCRIPTIONS[action] || 'Bono Automático',
                timestamp: new Date().toISOString(),
                status: 'PENDIENTE'
            });
        }
        await batch.commit().catch(e => console.error("Error asignando puntos", e));
    };

    const addManualPoints = async (adminId: string, amount: number, description: string) => {
        await addDoc(collection(db, "loyaltyTransactions"), {
            adminId: adminId,
            amount: amount,
            reason: 'MANUAL',
            description: description,
            timestamp: new Date().toISOString(),
            status: 'PENDIENTE'
        });
    };

    const approveLoyaltyTransaction = async (id: string) => {
        const transRef = doc(db, "loyaltyTransactions", id);
        const transSnap = await getDoc(transRef);
        const currentStatus = transSnap.data()?.status;
        if (!transSnap.exists() || (currentStatus && currentStatus !== 'PENDIENTE')) return;

        const data = transSnap.data() as LoyaltyTransaction;
        const adminRef = doc(db, "phAdmins", data.adminId);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
            const batch = writeBatch(db);
            const currentPoints = adminSnap.data().loyaltyPoints || 0;
            batch.update(adminRef, { loyaltyPoints: currentPoints + data.amount });
            batch.update(transRef, { status: 'APROBADO' });
            await batch.commit();
        }
    };

    const rejectLoyaltyTransaction = async (id: string, reason: string) => {
        await updateDoc(doc(db, "loyaltyTransactions", id), {
            status: 'RECHAZADO',
            rejectionReason: reason
        });
    };

    const updateLoyaltyRules = async (rules: LoyaltyRules) => {
        await setDoc(doc(db, "systemSettings", "loyalty"), rules);
    };

    const loginAdmin = async (email: string, pass: string) => {
        const hash = await hashString(pass);
        const admin = phAdmins.find(a => (a.email || '').toLowerCase() === email.toLowerCase() && (a.password === hash || a.password === pass));
        if (admin) {
            setCurrentAdmin(admin);
            setSelectedCopropiedadId(null);
            setSelectedAsambleaId(null);
            localStorage.setItem('ph_admin_session', JSON.stringify(admin));
            return { success: true };
        }
        return { success: false, message: 'Credenciales incorrectas.' };
    };

    const logoutAdmin = useCallback(() => {
        setCurrentAdmin(null);
        setSelectedCopropiedadId(null);
        setSelectedAsambleaId(null);
        localStorage.removeItem('ph_admin_session');
        localStorage.removeItem('ph_selected_cp');
        localStorage.removeItem('ph_selected_as');
    }, []);

    const loginSuperAdmin = async (email: string, pass: string) => {
        const hash = await hashString(pass);
        const admin = superAdmins.find(a => (a.email || '').toLowerCase() === email.toLowerCase() && (a.password === hash || a.password === pass));
        if (admin) {
            setCurrentSuperAdmin(admin);
            localStorage.setItem('ph_super_session', JSON.stringify(admin));
            return { success: true };
        }
        return { success: false, message: 'Credenciales maestras incorrectas.' };
    };

    const logoutSuperAdmin = useCallback(() => {
        setCurrentSuperAdmin(null);
        localStorage.removeItem('ph_super_session');
    }, []);

    const registerAdmin = async (data: any) => {
        const exists = phAdmins.some(a => (a.email || '').toLowerCase() === data.email.toLowerCase());
        if (exists) return { success: false, message: 'El correo ya está registrado.' };
        const secureData = { ...data, password: await hashString(data.password), loyaltyPoints: 0 };
        const docRef = await addDoc(collection(db, "phAdmins"), secureData);
        const newAdmin = { id: docRef.id, ...secureData };
        await assignLoyaltyPoints(docRef.id, 'pointsRegister');
        setCurrentAdmin(newAdmin);
        localStorage.setItem('ph_admin_session', JSON.stringify(newAdmin));
        return { success: true };
    };

    const loginByToken = async (token: string) => {
        const q = query(collection(db, "asambleistas"), where("token", "==", token.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) return { success: false, message: 'Código de acceso no encontrado.' };
        let user = { id: snap.docs[0].id, ...snap.docs[0].data() } as Asambleista;
        const asmDoc = await getDoc(doc(db, "asambleas", user.asambleaId));
        if (asmDoc.exists()) {
            const asmData = asmDoc.data();
            if (asmData.status === 'FINALIZADA') return { success: false, message: 'Esta asamblea ya ha finalizado.' };
            if ((asmData.status === 'EN_CURSO' || asmData.status === 'PROGRAMADA') && !user.asistenciaConfirmada) {
                await updateDoc(doc(db, "asambleistas", user.id), { asistenciaConfirmada: true }).catch(() => { });
            }
        }
        setCurrentUser(user);
        setSelectedAsambleaId(user.asambleaId);
        setSelectedCopropiedadId(user.copropiedadId);
        localStorage.setItem('ph_voter_session', JSON.stringify(user));
        return { success: true };
    };

    const logout = useCallback(() => {
        setCurrentUser(null);
        setSelectedAsambleaId(null);
        setSelectedCopropiedadId(null);
        localStorage.removeItem('ph_voter_session');
    }, []);

    const recoverEmailByPhone = async (phone: string) => {
        const admin = phAdmins.find(a => a.telefono === phone);
        return admin ? admin.email : null;
    };

    const selectCopropiedad = (id: string | null) => {
        setSelectedCopropiedadId(id);
        setSelectedAsambleaId(null);
        if (id) localStorage.setItem('ph_selected_cp', id);
        else localStorage.removeItem('ph_selected_cp');
    };

    const selectAsamblea = (id: string | null) => {
        setSelectedAsambleaId(id);
        if (id) localStorage.setItem('ph_selected_as', id);
        else localStorage.removeItem('ph_selected_as');
    };

    const addCopropiedad = async (data: any) => {
        const adminIds = data.adminIds || (data.adminId ? [data.adminId] : []);
        await addDoc(collection(db, "copropiedades"), {
            ...data, adminIds, fechaRegistro: new Date().toISOString(), status: 'PROGRAMADA', pagoConfirmado: false
        });
        if (adminIds.length > 0) await assignLoyaltyPoints(adminIds, 'pointsCreateBuilding');
    };
    const updateCopropiedad = async (id: string, data: any) => {
        const existing = copropiedades.find(c => c.id === id);
        await updateDoc(doc(db, "copropiedades", id), data);
        if (existing && !existing.representacionLegal && data.representacionLegal) {
            const ids = existing.adminIds || (existing.adminId ? [existing.adminId] : []);
            if (ids.length > 0) await assignLoyaltyPoints(ids, 'pointsUploadLegal');
        }
    };
    const deleteCopropiedad = async (id: string) => { await deleteDoc(doc(db, "copropiedades", id)); };

    const createAsamblea = async (data: any) => {
        await addDoc(collection(db, "asambleas"), { ...data, status: 'PROGRAMADA', pagoConfirmado: false, aiGenerationCount: 0, bulkEmailCount: 0 });
        const cp = copropiedades.find(c => c.id === data.copropiedadId);
        if (cp) {
            const ids = cp.adminIds || (cp.adminId ? [cp.adminId] : []);
            if (ids.length > 0) await assignLoyaltyPoints(ids, 'pointsCreateAssembly');
        }
    };
    const updateAsamblea = async (id: string, data: any) => { await updateDoc(doc(db, "asambleas", id), data); };
    const deleteAsamblea = async (id: string) => { await deleteDoc(doc(db, "asambleas", id)); };
    const startAssembly = async (id: string) => {
        await updateDoc(doc(db, "asambleas", id), { status: 'EN_CURSO', horaInicioReal: new Date().toISOString() });
    };
    const endAssembly = async (id: string) => {
        await updateDoc(doc(db, "asambleas", id), { status: 'FINALIZADA', horaFinReal: new Date().toISOString() });
    };
    const confirmPayment = async (id: string) => {
        const asmDoc = await getDoc(doc(db, "asambleas", id));
        if (!asmDoc.exists()) return;
        const asm = asmDoc.data() as Asamblea;
        await updateDoc(doc(db, "asambleas", id), { pagoConfirmado: true });
        const cp = copropiedades.find(c => c.id === asm.copropiedadId);
        if (cp) {
            const ids = cp.adminIds || (cp.adminId ? [cp.adminId] : []);
            if (ids.length > 0) {
                await assignLoyaltyPoints(ids, asm.serviceType === 'PREMIUM' ? 'pointsServicePremium' : 'pointsServiceBasic');
                if (asm.actaInteligenteEnabled) await assignLoyaltyPoints(ids, 'pointsServiceAI');
            }
        }
    };

    const updateAdmin = async (id: string, data: any) => {
        const payload = { ...data };
        if (payload.password) payload.password = await hashString(payload.password);
        else delete payload.password;
        await updateDoc(doc(db, "phAdmins", id), payload);
    };
    const deleteAdmin = async (id: string) => { await deleteDoc(doc(db, "phAdmins", id)); };

    const registerSuperAdmin = async (data: any) => { await addDoc(collection(db, "superAdmins"), { ...data, password: await hashString(data.password) }); };
    const updateSuperAdmin = async (id: string, data: any) => {
        const payload = { ...data };
        if (payload.password) payload.password = await hashString(payload.password);
        else delete payload.password;
        await updateDoc(doc(db, "superAdmins", id), payload);
    };
    const deleteSuperAdmin = async (id: string) => { await deleteDoc(doc(db, "superAdmins", id)); };

    const addUnit = async (data: any) => {
        if (!selectedCopropiedadId) return;
        // Se elimina la generación de token al crear la unidad
        await addDoc(collection(db, "unidades"), { ...data, copropiedadId: selectedCopropiedadId, token: '', emailSentCount: 0 });
    };
    const updateUnit = async (id: string, data: any) => { await updateDoc(doc(db, "unidades", id), data); };
    const deleteUnit = async (id: string) => { await deleteDoc(doc(db, "unidades", id)); };
    const bulkAddUnits = async (units: any[]) => {
        if (!selectedCopropiedadId) return;
        const batch = writeBatch(db);
        for (const u of units) {
            const ref = doc(collection(db, "unidades"));
            // Se elimina la generación de token en la carga masiva y se inicia contador
            batch.set(ref, { ...u, copropiedadId: selectedCopropiedadId, token: '', emailSentCount: 0 });
        }
        await batch.commit();
    };
    const regenerateUnitToken = async (id: string) => {
        const newToken = await generateUnitToken();
        const batch = writeBatch(db);

        // 1. Update Unit
        batch.update(doc(db, "unidades", id), { token: newToken });

        // 2. Update Asambleista Access if exists for this assembly
        if (selectedAsambleaId) {
            const asmRecord = asambleistas.find(a =>
                a.asambleaId === selectedAsambleaId &&
                a.unidadesIds.includes(id) &&
                !a.esApoderado
            );
            if (asmRecord) {
                batch.update(doc(db, "asambleistas", asmRecord.id), { token: newToken });
            }
        }

        await batch.commit();
    };
    const generateUnitToken = async () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let token = '';
        for (let i = 0; i < 6; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
        return token;
    };
    const getTotalBuildingCoefficient = (cpId: string) => {
        return unidades.filter(u => u.copropiedadId === cpId).reduce((acc, u) => acc + (u.coeficiente || u.coefficient || 0), 0);
    };

    const registerBulkEmailSent = async (asambleaId: string) => {
        await updateDoc(doc(db, "asambleas", asambleaId), {
            bulkEmailCount: increment(1)
        });
    };

    const sendEmailInvitation = async (unitId: string) => {
        if (!selectedAsambleaId || !selectedCopropiedadId || !currentAdmin) return { success: false, message: 'Datos incompletos.' };
        const unit = unidades.find(u => u.id === unitId);
        const assembly = asambleas.find(a => a.id === selectedAsambleaId);
        const copropiedad = copropiedades.find(c => c.id === selectedCopropiedadId);
        if (!unit || !unit.email || !assembly || !copropiedad) return { success: false, message: 'Error en datos.' };

        // VALIDACIÓN DE LÍMITE (MAX 2 VECES)
        const sentCount = unit.emailSentCount || 0;
        if (sentCount >= 2) {
            return { success: false, message: 'Límite de envíos alcanzado (Máx 2).' };
        }

        let token = unit.token || await generateUnitToken();
        const batch = writeBatch(db);

        // Update token if needed and increment count
        if (!unit.token) {
            batch.update(doc(db, "unidades", unitId), { token, emailSentCount: increment(1) });
        } else {
            batch.update(doc(db, "unidades", unitId), { emailSentCount: increment(1) });
        }
        await batch.commit();

        const magicLink = `${PRODUCTION_DOMAIN}/?token=${token}`;
        try {
            const sendMailFunction = httpsCallable(functions, 'sendAssemblyToken');
            const response = await sendMailFunction({
                to: unit.email, unitName: unit.nombre, ownerName: unit.propietario, token, magicLink,
                assemblyName: assembly.nombre, assemblyDate: assembly.fecha, propertyName: copropiedad.nombre, adminName: currentAdmin.nombre
            });
            // @ts-ignore
            return (response.data && response.data.success) ? { success: true } : { success: false, message: response.data?.message };
        } catch (error: any) { return { success: false, message: error.message }; }
    };

    const addAsambleista = async (data: any) => {
        if (!selectedAsambleaId) throw new Error("No assembly selected");
        let tokenToUse = data.token;
        if (!tokenToUse) tokenToUse = await generateUnitToken();
        await addDoc(collection(db, "asambleistas"), { ...data, token: tokenToUse, asambleaId: selectedAsambleaId, copropiedadId: selectedCopropiedadId });
    };
    const deleteAsambleista = async (id: string) => { await deleteDoc(doc(db, "asambleistas", id)); };
    const toggleAttendance = async (id: string) => {
        const asm = asambleistas.find(a => a.id === id);
        if (asm) await updateDoc(doc(db, "asambleistas", id), { asistenciaConfirmada: !asm.asistenciaConfirmada });
    };
    const updateBatchAttendance = async (ids: string[], status: boolean) => {
        const batch = writeBatch(db);
        ids.forEach(id => { batch.update(doc(db, "asambleistas", id), { asistenciaConfirmada: status }); });
        await batch.commit();
    };

    const registerProxy = async (data: any) => {
        if (!selectedAsambleaId || !data.unitIds?.length) return;
        const firstUnitId = data.unitIds[0];
        const firstUnit = unidades.find(u => u.id === firstUnitId);

        let tokenToUse = data.tokenToUse;
        if (!tokenToUse) {
            tokenToUse = firstUnit?.token || await generateUnitToken();
            if (firstUnit && !firstUnit.token) {
                await updateDoc(doc(db, "unidades", firstUnitId), { token: tokenToUse });
            }
        }

        await addDoc(collection(db, "asambleistas"), {
            nombre: data.nombre, documento: data.documento, esApoderado: true, unidadesIds: data.unitIds,
            token: tokenToUse, asambleaId: selectedAsambleaId, copropiedadId: selectedCopropiedadId, asistenciaConfirmada: false
        });
    };

    const unlinkProxyUnits = async (proxyId: string, unitIds: string[]) => {
        const proxy = asambleistas.find(a => a.id === proxyId);
        if (!proxy) return;
        const newUnits = proxy.unidadesIds.filter(uid => !unitIds.includes(uid));
        if (newUnits.length === 0) await deleteDoc(doc(db, "asambleistas", proxyId));
        else await updateDoc(doc(db, "asambleistas", proxyId), { unidadesIds: newUnits });
    };

    const addProxyUnits = async (proxyId: string, unitIds: string[]) => {
        const proxy = asambleistas.find(a => a.id === proxyId);
        if (!proxy) return;
        const newUnits = [...new Set([...proxy.unidadesIds, ...unitIds])];
        await updateDoc(doc(db, "asambleistas", proxyId), { unidadesIds: newUnits });
    };

    const getAsambleistaByUnit = (unitId: string) => {
        return asambleistas.find(a => a.asambleaId === selectedAsambleaId && a.unidadesIds.includes(unitId));
    };

    const generateMassCredentials = async () => {
        if (!selectedAsambleaId || !selectedCopropiedadId) return { created: 0, updated: 0 };
        const targetUnits = unidades.filter(u => u.copropiedadId === selectedCopropiedadId);

        const CHUNK_SIZE = 200;
        const chunks = [];
        for (let i = 0; i < targetUnits.length; i += CHUNK_SIZE) {
            chunks.push(targetUnits.slice(i, i + CHUNK_SIZE));
        }

        let totalCreated = 0;
        let totalUpdated = 0;

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            let count = 0;

            for (const u of chunk) {
                const existing = asambleistas.find(a =>
                    a.asambleaId === selectedAsambleaId &&
                    a.unidadesIds.includes(u.id)
                );

                if (!existing) {
                    const token = await generateUnitToken();

                    const newAsmRef = doc(collection(db, "asambleistas"));
                    batch.set(newAsmRef, {
                        nombre: u.propietario || `Propietario ${u.nombre}`,
                        email: u.email || '',
                        token: token,
                        unidadesIds: [u.id],
                        esApoderado: false,
                        asistenciaConfirmada: false,
                        copropiedadId: selectedCopropiedadId,
                        asambleaId: selectedAsambleaId
                    });

                    batch.update(doc(db, "unidades", u.id), { token });
                    totalCreated++;
                    count++;
                } else {
                    let needsUpdate = false;
                    let tokenToUse = existing.token;

                    // Fix: If existing asambleista has no token, generate one
                    if (!tokenToUse) {
                        tokenToUse = await generateUnitToken();
                        batch.update(doc(db, "asambleistas", existing.id), { token: tokenToUse });
                        needsUpdate = true;
                    }

                    // Fix: Ensure unit has visual token synced
                    if (u.token !== tokenToUse) {
                        batch.update(doc(db, "unidades", u.id), { token: tokenToUse });
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        totalUpdated++;
                        count++;
                    }
                }
            }

            if (count > 0) {
                await batch.commit();
            }
        }
        return { created: totalCreated, updated: totalUpdated };
    };

    const clearMassCredentials = async () => {
        if (!selectedAsambleaId || !selectedCopropiedadId) return { deleted: 0 };

        const targetUnits = unidades.filter(u => u.copropiedadId === selectedCopropiedadId && u.token);
        const targetAsm = asambleistas.filter(a => a.asambleaId === selectedAsambleaId);

        const allOps = [
            ...targetUnits.map(u => ({ type: 'unit', ref: doc(db, "unidades", u.id) })),
            ...targetAsm.map(a => ({ type: 'asm', ref: doc(db, "asambleistas", a.id) }))
        ];

        const CHUNK_SIZE = 450;
        const chunks = [];
        for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
            chunks.push(allOps.slice(i, i + CHUNK_SIZE));
        }

        let totalOps = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(op => {
                if (op.type === 'asm') {
                    // Solo borramos el token, mantenemos el registro para no perder asistencias o poderes
                    batch.update(op.ref, { token: '' });
                } else {
                    batch.update(op.ref, { token: '' });
                }
                totalOps++;
            });
            await batch.commit();
        }
        return { deleted: totalOps };
    };

    const addQuestion = async (texto: string, opciones: string[], tiempo: number, esMultiple: boolean) => {
        await addDoc(collection(db, "preguntas"), {
            texto, opciones: opciones.map((t, i) => ({ id: `op-${Date.now()}-${i}`, texto: t })),
            tiempoRestante: tiempo, esMultiple, status: 'PENDIENTE', totalVotos: 0,
            asambleaId: selectedAsambleaId, copropiedadId: selectedCopropiedadId,
            createdAt: new Date().toISOString()
        });
    };

    const updateQuestion = async (id: string, texto: string, opciones: string[], tiempo: number, esMultiple: boolean) => {
        const payload: any = { texto, tiempoRestante: tiempo, esMultiple };
        if (opciones.length > 0) payload.opciones = opciones.map((t, i) => ({ id: `op-${Date.now()}-${i}`, texto: t }));
        await updateDoc(doc(db, "preguntas", id), payload);
    };

    const openQuestion = async (id: string) => {
        const batch = writeBatch(db);
        preguntas.filter(p => p.asambleaId === selectedAsambleaId && p.status === 'ABIERTA').forEach(p => { batch.update(doc(db, "preguntas", p.id), { status: 'CERRADA' }); });
        batch.update(doc(db, "preguntas", id), { status: 'ABIERTA', startedAt: new Date().toISOString() });
        await batch.commit();
    };

    const closeQuestion = async (id: string) => { await updateDoc(doc(db, "preguntas", id), { status: 'CERRADA' }); };

    const reopenQuestion = async (id: string, tiempo: number) => {
        const batch = writeBatch(db);
        preguntas.filter(p => p.asambleaId === selectedAsambleaId && p.status === 'ABIERTA').forEach(p => { batch.update(doc(db, "preguntas", p.id), { status: 'CERRADA' }); });
        batch.update(doc(db, "preguntas", id), { status: 'ABIERTA', tiempoRestante: tiempo, startedAt: new Date().toISOString() });
        await batch.commit();
    };

    const reorderQuestions = async (orderedIds: string[]) => {
        const batch = writeBatch(db);
        orderedIds.forEach((id, index) => {
            batch.update(doc(db, "preguntas", id), { orden: index });
        });
        await batch.commit();
    };

    const submitVote = async (qId: string, asmId: string, selection: string[]) => {
        const existing = votos.find(v => v.preguntaId === qId && v.asambleistaId === asmId);
        if (existing) return;
        const voter = asambleistas.find(a => a.id === asmId);
        const coef = getVoterCoefficient(voter);
        await addDoc(collection(db, "votos"), {
            preguntaId: qId, asambleistaId: asmId, respuestas: selection, opcionId: selection[0],
            coeficiente: coef, timestamp: new Date().toISOString(), asambleaId: selectedAsambleaId
        });
        if (voter && !voter.asistenciaConfirmada) await updateDoc(doc(db, "asambleistas", asmId), { asistenciaConfirmada: true });
    };

    const calculateResults = (qId: string, type: 'coeficiente' | 'nominal') => {
        const q = preguntas.find(p => p.id === qId);
        if (!q) return [];
        const qVotos = votos.filter(v => v.preguntaId === qId);
        const presentUsers = asambleistas.filter(a => a.asambleaId === q.asambleaId && a.asistenciaConfirmada);
        const totalPresentCount = presentUsers.length || 1;
        const totalPresentCoef = presentUsers.reduce((acc, a) => acc + getVoterCoefficient(a), 0) || 0.000001;
        const results = q.opciones.map(opt => {
            const votesForOpt = qVotos.filter(v => v.respuestas?.includes(opt.id) || v.opcionId === opt.id);
            if (type === 'nominal') {
                const count = votesForOpt.length;
                return { label: opt.texto, absoluteValue: count, value: (count / totalPresentCount) * 100 };
            } else {
                const sumCoef = votesForOpt.reduce((acc, v) => acc + getVoterCoefficient(asambleistas.find(a => a.id === v.asambleistaId) || null), 0);
                return { label: opt.texto, absoluteValue: sumCoef, value: (sumCoef / totalPresentCoef) * 100 };
            }
        });
        const participatedIds = new Set(qVotos.map(v => v.asambleistaId));
        if (type === 'nominal') {
            const notVotedCount = Math.max(0, presentUsers.length - participatedIds.size);
            results.push({ label: 'SIN VOTAR', absoluteValue: notVotedCount, value: (notVotedCount / totalPresentCount) * 100 });
        } else {
            const participatedCoef = presentUsers.filter(u => participatedIds.has(u.id)).reduce((acc, u) => acc + getVoterCoefficient(u), 0);
            const notVotedCoef = Math.max(0, totalPresentCoef - participatedCoef);
            results.push({ label: 'SIN VOTAR', absoluteValue: notVotedCoef, value: (notVotedCoef / totalPresentCoef) * 100 });
        }
        return results;
    };

    const getVoterCoefficient = (voter: Asambleista | null) => {
        if (!voter) return 0;
        return voter.unidadesIds.reduce((acc, uid) => acc + (unidades.find(un => un.id === uid)?.coeficiente || 0), 0);
    };

    const getVoterUnidades = (voter: Asambleista | null) => {
        if (!voter) return [];
        return unidades.filter(u => voter.unidadesIds.includes(u.id));
    };

    const initializeDatabase = async () => { console.log("DB Init"); };

    const generateAssemblySummary = async (audioFile: File) => {
        if (!selectedAsambleaId) throw new Error("No hay asamblea");
        const currentAssembly = asambleas.find(a => a.id === selectedAsambleaId);
        if ((currentAssembly?.aiGenerationCount || 0) >= 2) throw new Error("Límite alcanzado.");

        // Fix: API key must be obtained exclusively from process.env.API_KEY according to guidelines

        // Intentar autenticación anónima si no hay usuario (Necesario para Firestore si reglas != public)
        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (e: any) {
                console.warn("Advertencia de Autenticación Firebase (SignInAnonymously):", e.code || e.message);
                // No lanzamos error aquí para permitir que continúe si la BD es pública o si es un entorno local
                if (e.code === 'auth/requests-from-referer-blocked') {
                    console.warn(`El dominio actual (${window.location.hostname}) no está autorizado en Firebase Auth.`);
                }
            }
        }

        setAiStatus('Iniciando...');
        // Fix: Always use process.env.API_KEY directly for GoogleGenAI initialization
        const apiKey = getContextEnv('VITE_GEMINI_API_KEY', '');
        if (!apiKey) throw new Error("API Key configuration missing (VITE_GEMINI_API_KEY).");
        const ai = new GoogleGenAI({ apiKey });
        const CHUNK_SIZE = 10 * 1024 * 1024;
        const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE);
        let combinedSummaries = "";
        for (let i = 0; i < totalChunks; i++) {
            setAiStatus(`Analizando ${i + 1}/${totalChunks}...`);
            const chunkBlob = audioFile.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, audioFile.size), audioFile.type);
            const base64Data = await new Promise<string>((resolve, reject) => {
                const r = new FileReader(); r.onload = () => resolve((r.result as string).split(',')[1]); r.onerror = reject; r.readAsDataURL(chunkBlob);
            });
            // Fix: Use correct generateContent structure according to coding guidelines (contents as { parts: [...] })
            const res = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: {
                    parts: [
                        { text: `Resume fragmento ${i + 1} de asamblea.` },
                        { inlineData: { mimeType: audioFile.type || "audio/mpeg", data: base64Data } }
                    ]
                }
            });
            combinedSummaries += `\n${res.text}\n`;
        }
        // Fix: Use correct generateContent structure according to coding guidelines
        const final = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [{ text: `Redacta ACTA FINAL bajo Ley 675 con:\n${combinedSummaries}` }]
            }
        });
        await updateDoc(doc(db, "asambleas", selectedAsambleaId), { resumenIA: final.text, actaInteligenteEnabled: true, aiGenerationCount: (currentAssembly?.aiGenerationCount || 0) + 1 });
        setAiStatus('');
    };

    const saveManualSummary = async (text: string) => { if (selectedAsambleaId) await updateDoc(doc(db, "asambleas", selectedAsambleaId), { resumenIA: text }); };

    return (
        <AssemblyContext.Provider value={{
            isDbReady, copropiedades, asambleas, unidades, asambleistas, preguntas, votos, phAdmins, superAdmins, plantillas, loyaltyRules, loyaltyTransactions,
            selectedCopropiedadId, selectedAsambleaId, currentUser, currentAdmin, currentSuperAdmin, activeQuestion, sessionStatus, aiStatus,
            loginByToken, logout, loginAdmin, logoutAdmin, loginSuperAdmin, logoutSuperAdmin, registerAdmin, recoverEmailByPhone,
            selectCopropiedad, selectAsamblea, addCopropiedad, updateCopropiedad, deleteCopropiedad,
            createAsamblea, updateAsamblea, deleteAsamblea, startAssembly, endAssembly, confirmPayment,
            updateAdmin, deleteAdmin, registerSuperAdmin, updateSuperAdmin, deleteSuperAdmin, updateLoyaltyRules, addManualPoints,
            approveLoyaltyTransaction, rejectLoyaltyTransaction,
            addUnit, updateUnit, deleteUnit, bulkAddUnits, regenerateUnitToken, getTotalBuildingCoefficient,
            addAsambleista, deleteAsambleista, toggleAttendance, updateBatchAttendance, registerProxy, unlinkProxyUnits, addProxyUnits, getAsambleistaByUnit, generateMassCredentials, clearMassCredentials,
            addQuestion, updateQuestion, openQuestion, closeQuestion, reopenQuestion, submitVote, calculateResults, reorderQuestions,
            getVoterCoefficient, getVoterUnidades, initializeDatabase,
            generateAssemblySummary, saveManualSummary, sendEmailInvitation, registerBulkEmailSent
        }}>
            {children}
        </AssemblyContext.Provider>
    );
};

export const useAssembly = () => {
    const context = useContext(AssemblyContext);
    if (!context) throw new Error("useAssembly must be used within AssemblyProvider");
    return context;
};