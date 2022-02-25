import axios, {AxiosError} from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let isRefreshing = false;
let faildRequestsQueue = []  //requisição com falha de token expirado

export function setupAPIClient(context = undefined) {

    let cookies = parseCookies(context);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    })
    
    api.interceptors.response.use(response => {
        return response;
    },(error: AxiosError) => {
        if (error.response.status === 401) {
            if(error.response.data?.code === 'token.expired'){
                //renova o token
                cookies = parseCookies(context);
    
                const{'nextauth.refreshToken': refreshToken} = cookies;
    
                const originalConfig = error.config //informações para a repetição de uma requisições no back-end
    
                if (!isRefreshing){ //unica chamada na api
    
                    isRefreshing = true
    
                    api.post('/refresh', {
                        refreshToken,
                    }).then(response => {
                        const {token} = response.data
        
                        setCookie(context, 'nextauth.token', token,{
                            maxAge: 60 * 60 * 24 * 30,//tempo do cookie salvo no navegador (30 dias)
                            path: '/' ,//caminhos da aplicação com acesso ao cookie
                        })
                        setCookie(context, 'nextauth.refreshToken', response.data.refreshToken,{
                            maxAge: 60 * 60 * 24 * 30,
                            path: '/' ,
                        })
        
                        api.defaults.headers['Authorization'] = `Bearer ${token}`
    
                        faildRequestsQueue.forEach(request => request.onSuccess(token))
                        faildRequestsQueue = [];
    
                    }).catch(error => {
    
                        faildRequestsQueue.forEach(request => request.onFailure(error))
                        faildRequestsQueue = [];
    
                        if(process.browser){
                            signOut();
                        }
    
                    }).finally(() => {
    
                        isRefreshing = false;
                    })
                }
    
                return new Promise((resolve, reject) => {
                    faildRequestsQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`
    
                            resolve(api(originalConfig))
                        },
                        onFailure: (error: AxiosError) => {
                            reject(error)
                        },
                    })
                })
    
            }else{
                //desloga o usuário
                if(process.browser){
                    signOut();
                }
            }
        }
    
        return Promise.reject(error);
    });

    return api
}