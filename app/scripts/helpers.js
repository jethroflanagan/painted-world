var prefix = 'component-PaintBySpending_';

export function resolveClasses (list) {
    return list.split(' ').map(function (name) {
        return name.indexOf('js-') === -1
            ? prefix + name
            : name;
    }).join(' ');
    
}

// doens't support ignoring js-
export function resolveDynamicClasses (text) {
    var key = text.replace(/(')([a-z][a-z0-9\-]+)('\s*:.*,?\s*)/ig, '$1' + prefix + '$2$3');
	return key;
}

export function applyCssModule (template) {
    // :class matching
    // template.match(/(:class="{\s*)(('[a-z][a-z0-9\-]+)\s*'\s*:.*,?\s*)+}\s*"/i)

    var modularized = template.replace(
        /(class=")(([a-z0-9\-]+ ?)+)(")/ig, function (matched, partStart, partClasses, partIgnore, partEnd) {
            return partStart + resolveClasses(partClasses) + partEnd;
        }
    )
    .replace(
        // dirty match cos JS can't keep more than one match in memory for multiple `'class':X` matches
        /(:class="{\s*)((?:'[a-z][a-z0-9\-]+'\s*:.*,?\s*)+)(\s*}\s*")/ig, function (matched, partStart, inner, partEnd) {
            return partStart + resolveDynamicClasses(inner) + partEnd;
        }
    );
    console.log(modularized);
    return modularized;
}
