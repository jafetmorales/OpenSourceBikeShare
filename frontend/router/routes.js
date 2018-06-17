import store from '@state/store'
import Home from '@views/home'
import Login from '@views/login'
import StandDetail from '@views/stand-detail'
import axios from 'axios'

export default [
    {
        path: '/',
        name: 'home',
        meta: {
            authRequired: true,
        },
        component: Home,
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        beforeEnter(routeTo, routeFrom, next) {
            // TODO make login work
            // if (store.getters['auth/loggedIn']) {
            //     next({ name: 'home' })
            // } else {
                next()
            // }
        },
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => lazyLoadView(require('@views/profile')),
        meta: {
            authRequired: true,
        },
        props: route => ({ user: store.state.auth.currentUser }),
    },
    {
        path: '/stand/:uuid',
        name: 'stand',
        component: StandDetail,
        meta: {
            authRequired: true,
        },
        beforeEnter(routeTo, routeFrom, next) {
            let uuid = routeTo.params.uuid
            axios.get('/api/stands/' + uuid + '?include=bikes')
                .then(response => {
                    routeTo.params.stand = response.data
                    next();
                })
                .catch(() => {
                    next({ name: '404', params: { resource: 'Stand' } })
                })
        },
        props: route => ({
            uuid: route.params.uuid,
            stand: route.params.stand
        }),
    },
    {
        path: '/profile/:username',
        name: 'username-profile',
        component: () => lazyLoadView(require('@views/profile')),
        meta: {
            authRequired: true,
        },
        beforeEnter(routeTo, routeFrom, next) {
            store
            // Try to fetch the user's information by their username
                .dispatch('users/fetchUser', { username: routeTo.params.username })
                .then(user => {
                    routeTo.params.user = user
                    next()
                })
                .catch(() => {
                    next({ name: '404', params: { resource: 'User' } })
                })
        },
        // Set the user from the route params, once it's set in the
        // beforeEnter route guard.
        props: route => ({ user: route.params.user }),
    },
    {
        path: '/logout',
        name: 'logout',
        meta: {
            authRequired: true,
        },
        beforeEnter(routeTo, routeFrom, next) {
            store.dispatch('auth/logOut')
            next({ name: 'login' })
            // TODO enable routing to previous page
            // const authRequiredOnPreviousRoute = routeFrom.matched.some(
            //     route => route.meta.authRequired
            // )
            // console.log('logging out, previous route required auth:' + authRequiredOnPreviousRoute)
            // Navigate back to previous page, or home as a fallback
            // next(authRequiredOnPreviousRoute ? { name: 'login' } : { ...routeFrom })
        },
    },
    {
        path: '/404',
        name: '404',
        component: require('@views/404').default,
        // Allows props to be passed to the 404 page through route
        // params, such as `resource` to define what wasn't found.
        props: true,
    },
    // Redirect any unmatched routes to the 404 page. This may
    // require some server configuration to work in production:
    // https://router.vuejs.org/en/essentials/history-mode.html#example-server-configurations
    {
        path: '*',
        redirect: '404',
    },
]

// Lazy-loads view components, but with better UX. A loading view
// will be used if the component takes a while to load, falling
// back to a timeout view in case the page fails to load. You can
// use this component to lazy-load a route with:
//
// component: () => lazyLoadView(import('@views/my-view'))
//
// NOTE: Components loaded with this strategy DO NOT have access
// to in-component guards, such as beforeRouteEnter,
// beforeRouteUpdate, and beforeRouteLeave. You must either use
// route-level guards instead or lazy-load the component directly:
//
// component: () => import('@views/my-view')
//
function lazyLoadView(AsyncView) {
    const AsyncHandler = () => ({
        component: AsyncView,
        // A component to use while the component is loading.
        loading: require('@views/loading').default,
        // A fallback component in case the timeout is exceeded
        // when loading the component.
        error: require('@views/timeout').default,
        // Delay before showing the loading component.
        // Default: 200 (milliseconds).
        delay: 400,
        // Time before giving up trying to load the component.
        // Default: Infinity (milliseconds).
        timeout: 10000,
    })

    return Promise.resolve({
        functional: true,
        render(h, { data, children }) {
            // Transparently pass any props or children
            // to the view component.
            return h(AsyncHandler, data, children)
        },
    })
}