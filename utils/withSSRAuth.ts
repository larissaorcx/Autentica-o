import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { destroyCookie, parseCookies } from "nookies"
import { AuthTokenError } from "../services/error/AuthTokenError"
import decode from 'jwt-decode'
import { ValidateUserPermissions } from "./validateUserPermissions"

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(funcao: GetServerSideProps<P>, options?: WithSSRAuthOptions): GetServerSideProps {
    return async(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(context)
        const token = cookies['nextauth.token']

        if(!token) {
          return {
            redirect:{
              destination: '/',
              permanent: false,
            }
          }
        }

        if(options){
          const user = decode<{permissions: string[], roles: string[] }>(token)

          const {permissions, roles} = options

          const userHadValidPermissions = ValidateUserPermissions({
            user,
            permissions, 
            roles
          })

          if(!userHadValidPermissions){
            return{
              redirect:{
                destination: '/dashboard',
                permanent: false,
              }
            }
          }
        }
  

        try{

          return await funcao(context)

        }catch(err){

            if(err instanceof AuthTokenError) {

              destroyCookie(context,'nextauth.token')
              destroyCookie(context,'nextauth.refreshToken')
              
              return {
                  redirect: {
                      destination: '/',
                      permanent: false,
                  }
              }
            }
        }
    }

}