import { withSSRAuth } from '../utils/withSSRAuth'
import { setupAPIClient } from '../services/api'


export default function Metrics () {
    return(
        <>
            <h1>Métricas</h1>
        </>
    )
}

export const getServerSideProps = withSSRAuth(async(context) => {
    const apiClient = setupAPIClient(context)
    const response = await apiClient.get('/me')

    return {
        props: {
            
        }
    }
},{
    permissions:['metrics.list'],
    roles: ['administrator']
})