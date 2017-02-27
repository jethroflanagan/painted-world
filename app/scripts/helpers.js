export function resolveClasses (list) {
    var prefix = 'component-PaintBySpending_';
    return list.split(' ').map(function (name) {
        return name.indexOf('js-') === -1
            ? prefix + name
            : name;
    }).join(' ');
}

export function applyCssModule (template) {
    // :class matching
    // template.match(/(:class="{\s*)(('[a-z][a-z0-9\-]+)\s*'\s*:.*,?\s*)+}\s*"/i)

    var modularized = template.replace(
        /(class=")(([a-zA-Z0-9\-]+ ?)+)(")/g, function (matched, partStart, partClasses, partIgnore, partEnd) {
            return partStart + resolveClasses(partClasses) + partEnd;
        }
    );
    return modularized;
}
