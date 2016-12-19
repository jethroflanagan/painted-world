import { GraphScreen } from './components/screens/graph-screen';
import { LoginScreen } from './components/screens/login-screen';

Vue.use(VueRouter);

let routes = [
  { name: 'login', path: '/', component: LoginScreen },
  { name: 'graph', path: '/graph', component: GraphScreen },
];

routes = routes.map((route) => {
    route.beforeEnter = (to, from, next) => {
        window.scroll(0, 0);
        next();
    };
    return route;
});

const router = new VueRouter({
  routes,
  // mode: 'history',
  // scrollBehavior (to, from, savedPosition) {
  //     return { x: 0, y: 0 }
  // },

})

export {
    router,
}
