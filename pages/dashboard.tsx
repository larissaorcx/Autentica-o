import {AuthContext} from '../contexts/AuthContext'
import { useContext, useEffect } from 'react'
import { api } from "../services/apiClient"
import { withSSRAuth } from '../utils/withSSRAuth'
import { setupAPIClient } from '../services/api'
import { useCan } from '../hooks/useCan'

export default function Dashboard () {
    const {user} = useContext(AuthContext)

    const useCanSeeMetrics = useCan({
        permissions: ['metrics.list']
    })

    useEffect(() => {
        api.get('/me').then(response => console.log(response))
    }, [])

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>

            {useCanSeeMetrics && <div>Métricas</div>}
        </>
    )
}

export const getServerSideProps = withSSRAuth(async(context) => {
    const apiClient = setupAPIClient(context)
    const response = await apiClient.get('/me')
    
    console.log(response.data)
    return {
        props: {
            
        }
    }
})