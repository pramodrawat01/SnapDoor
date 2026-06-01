import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";

interface AuthContextType {
    user : User | null;
    token : string | null;
    loading : boolean;
    login : (email : string, password : string) => Promise<void>;
    register : (name : string, email : string, password : string) => Promise<void>
    logout : () => void;
    updateUser : (userData : Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>( undefined)

export function AuthProvider({children} : { children : ReactNode}) {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [token , setToken] = useState<string | null>( null )
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const savedToken = localStorage.getItem("auth_token")
        const savedUser = localStorage.getItem("auth_user")

        if(savedToken && savedUser){
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }

        setLoading(false)
    }, [])

    // login function
    const login = async(email : string, password : string) => {
        try {
            const { data } =await api.post('/auth/login', {email, password})
            setToken(data.token )
            setUser(data.user)

            localStorage.setItem("auth_token" , data.token)
            localStorage.setItem("auth_user", JSON.stringify(data.user))
            toast.success("Login successful")
            navigate('/')
        } catch (err : any ) {
            toast.error(err?.response?.data?.message || err?.message)
        }
    }

    // login function
    const register = async(name : string, email : string, password : string) => {
        try {
            const { data } =await api.post('/auth/register', {name, email, password})
            setToken(data.token )
            setUser(data.user)

            localStorage.setItem("auth_token" , data.token)
            localStorage.setItem("auth_user", JSON.stringify(data.user))
            toast.success("Registeration successful")
            navigate('/')
        } catch (err : any ) {
            toast.error(err?.response?.data?.message || err?.message)
        }
    }


    //logout functions
    const logout = async()=>{
        setToken(null)
        setUser(null)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
    }

    // update user
    const updateUser = (userData : Partial<User>) => {
        if(user){
            const updated = {...user, ...userData};
            setUser(updated);
            localStorage.setItem('auth_user', JSON.stringify(updated))
        }
    }

    return <AuthContext.Provider value ={{
        user, token, loading, login, register, logout, updateUser 
    }}>
        {children}
    </AuthContext.Provider>

}

export function useAuth(){
    const context = useContext(AuthContext)
    if(!context) throw new Error("useAuth must be used within AuthProvider");

    return context;
}