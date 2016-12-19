// import { DashboardItem } from './dashboard-item';

const LoginScreen = Vue.component('login-screen', {
    template: `
        <div>
            <input placeholder="email" v-model="email">
            <input placeholder="password" type="password" v-model=">
        </div>
    `,
    props: [
    ],
    data: {
    },
    methods: {
    },
});

export {
    LoginScreen,
}
