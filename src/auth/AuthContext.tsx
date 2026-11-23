import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { api, TOKEN_KEY } from "../lib/api";

export type User = { id: number; name: string; identifier: string; google_linked?: boolean };

type Ctx = {
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (p: {
        name: string;
        identifier: string;
        password: string;
        password_confirmation: string;
    }) => Promise<void>;
    loginGoogle: (token: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) return;
        api
            .get("/auth/me")
            .then((r) => setUser(r.data.data))
            .catch(() => localStorage.removeItem(TOKEN_KEY))
            .finally(() => setLoading(false));
    }, []);

    const save = (d: { user: User; token: string }) => {
        localStorage.setItem(TOKEN_KEY, d.token);
        setUser(d.user);
    };

    const login: Ctx["login"] = async (identifier, password) => {
        const r = await api.post("/auth/login", { identifier, password });
        save(r.data.data);
    };

    const register: Ctx["register"] = async (p) => {
        const r = await api.post("/auth/register", p);
        save(r.data.data);
    };

    const loginGoogle: Ctx['loginGoogle'] = async (id_token) => { 
        const r = await api.post('/auth/google', {id_token});
        save(r.data.data);
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
