import { createContext, ReactNode, useEffect, useState } from "react";
import {parseCookies, setCookie, destroyCookie} from 'nookies'

import Router from 'next/router'

import { api } from "../services/apiClient";

type User = {
    email: string;
    permissions: string[];
    roles: string[],
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = { //informações do contexto
    signIn: (credentials: SignInCredentials)=>Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;
};

type AuthProviderProps = {
    children:ReactNode; 
}
export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')

    authChannel.postMessage('signOut') 

    Router.push('/');
}

export function AuthProvider({children}: AuthProviderProps){
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth') //criação do channel

        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    signOut();
                    authChannel.close(); //tira o looping
                    break;
                default:
                    break;
            }
        }
    },[])

    useEffect(() => {
        const {'nextauth.token': token} = parseCookies()

        if(token){
            api.get('/me').then(response => {
                const {email, permissions, roles} = response.data

                setUser({email, permissions, roles})
            })
            .catch(() => {
                signOut();
            })
        }
    }, [])

    async function signIn({email, password}: SignInCredentials){
        try{

            const response = await api.post('sessions', { //chamada do axios
                email,
                password,
            })

            const {token, refreshToken, permissions, roles} = response.data

            setCookie(undefined, 'nextauth.token', token,{
                maxAge: 60 * 60 * 24 * 30,//tempo do cookie salvo no navegador (30 dias)
                path: '/' ,//caminhos da aplicação com acesso ao cookie
            })
            setCookie(undefined, 'nextauth.refreshToken', refreshToken,{
                maxAge: 60 * 60 * 24 * 30,
                path: '/' ,
            })

            setUser({
                email,
                permissions,
                roles,
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard')
        }
        catch(err) {
            console.log(err);
        }

    }

    return(
        <AuthContext.Provider value={{signIn, signOut, isAuthenticated, user}}>
            {children}
        </AuthContext.Provider>
    )
}