const formatNumber = (value) => {
    if (typeof value === 'undefined') return 0;
    value = Math.round(value);
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

Vue.filter('number', value => formatNumber(value));

Vue.filter('currency', value => 'R' + formatNumber(value));

Vue.filter('date', function (value) {
    return moment(value).format('D MMMM YYYY');
});
Vue.filter('dateAgo', function (value, hideAgo) {
    return moment(value).fromNow(hideAgo);
});

//
Vue.filter('fuzzyDatePeriod', function (value, periodType) {
    let response = '';
    switch (periodType) {
        case 'year':
        case 'years':
        case 'y':
            const years = Math.floor(value);
            const months = Math.round((value - years) * 12);

            if (years > 0) {
                response += years + ' year' + (years !== 1 ? 's' : '');
            }
            if (months > 0) {
                if (years > 0) {
                    response += ' and ';
                }
                response += months + ' month'+ (months !== 1 ? 's' : '');
            }
            // response = response.replace(/ /g, '&nbsp;');
            return response;
            break;
    }
});

// export {};
