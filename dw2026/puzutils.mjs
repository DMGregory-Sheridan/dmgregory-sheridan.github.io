
//#region Reveal Animations
const DEFAULT_REVEAL_DELAY = 500;
let revealtime = DEFAULT_REVEAL_DELAY;
let revealPending = false;

function stagedReveal(timeOverride) {
    if (revealPending) return;
    revealPending = true;

    if (typeof(timeOverride) === 'number')
        setTimeout(revealStep, timeOverride);
    else 
        setTimeout(revealStep, 10);
}

function revealStep() {
   revealPending = false;
   const revelations = Array.from(document.getElementsByClassName('toreveal')).filter(element => !element.classList.contains('hidden'));
   const count = revelations.length;

   if (count < 1) {
    revealtime = DEFAULT_REVEAL_DELAY;
    return;
   }

   revelations[0].classList.remove('toreveal');

   revealtime = Math.min(revealtime + 200, 1000);

   if (count > 1) {
    stagedReveal(revealtime);
   } else {
    revealtime = DEFAULT_REVEAL_DELAY;
   }
}

stagedReveal(DEFAULT_REVEAL_DELAY);
//#endregion Reveal Animations

//#region Password Widgets
function isNumeric(c) {
    const code = c.charCodeAt(0);
    return (code > 47 && code < 58);   // numbers 0-9
}

function isAlphanumeric(c) {
    const code = c.charCodeAt(0);
    return (code > 47 && code < 58)   // numbers 0-9
        || (code > 64 && code < 91)   // uppercase A-Z
        || (code > 96 && code < 123); // lowercase a-z
}

const passphraseForms = {};
{    
    function solve(form) {
        form.classList.add('solved'); 
        return true; 
    }
    function unsolve(form) {
        form.classList.remove('solved'); 
        return false; 
    }
    function getKey(e) {
        if (e.key) return e.key;

        const code = e.keyCode;
        switch (code) {
            case 8: return 'Backspace';
            case 9: return 'Tab';
            case 13: return 'Enter';
            case 37: return 'ArrowLeft';
            case 39: return 'ArrowRight';
            case 46: return 'Delete';

            default: 
                if ((code > 47 && code < 58)   // numbers 0-9
                 || (code > 64 && code < 91)   // uppercase A-Z
                 || (code > 96 && code < 123) ) {
                    return String.fromCharCode(code);
                 }
        }
        return " ";
    }

    // Find and set up letter-by-letter password inputs
    const passwords = document.getElementsByClassName('charbychar');
    for (const pass of passwords) {
        

        const chars = Array.from(pass.children);
        const form = chars[0].form;
        passphraseForms[form.id] = form;

        form.getValue = () => {
            let text = '';
            for (const c of chars) {
                if (c.value || c.value === 0) text += c.value;
            }
            return text;
        }

        

        form.checkAnswer = (answer, silent) => {
            const text = form.getValue().trim().toUpperCase();
            if (typeof(answer) === 'string') {
                answer = answer.trim().toUpperCase();
                if (text === answer) {
                    console.log(`Submitted answer '${text}' is correct!`);
                    form.classList.add('solved');
                    return solve(form);
                }
                if (!silent) {
                    console.log(`Submitted answer '${text}' does not match the correct answer.`);
                    unsolve(form);
                }
                return false;
            }
            
            if (Array.isArray(answer)) {
                for(const value of answer) {
                    if (form.checkAnswer(value, true)) {
                        return solve(form);
                    }
                }
                console.log(`Submitted answer '${text}' does not match any of the correct answers.`);
                return unsolve(form);
            }

            if (typeof(answer) === 'function') {
                if(answer(text)) {
                    console.log(`Submitted answer '${text}' satisfies the solution function!`);
                    return solve(form);
                } else if (!silent) {
                    console.log(`Submitted answer '${text}' does not satisfy the solution function.`);
                    return unsolve(form);
                }
                return false;
            }

            // Otherwise, assume answer is a regular expression.
            if (typeof(answer) === 'object' && 'test' in answer.keys) {
                if (answer.test(text)) {
                    console.log(`Submitted answer '${text}' correctly matches the pattern!`);
                    return solve(form);
                } else if(!silent) {
                    console.log(`Submitted answer '${text}' does not match the answer pattern.`);
                    return unsolve(form);
                }
                return false;
            }

            console.log('Unsupported answer type:', answer);
        }

        const processInput = (e) => {
            let char = e.currentTarget;

            if (e.data && e.data.length) {
                const typedChars = Array.from(e.data);
                while (typedChars.length > 0) {
                    char.value = typedChars.shift();
                    if (char.index < chars.length - 1) {
                        char = chars[char.index + 1]
                        char.focus();
                    } else {
                        break;
                    }
                }
            }
        }

        const processKeypress = (e) => {
            const char = e.currentTarget;
            if (e.key === undefined || e.key === 'Unidentified' || e.keyCode === 229) {
                if (char.value) char.value = '';
                return false;
            }
            if (e.key === 'Tab') {
                return true;
            }
            if (e.key === 'Backspace') {
                if (char.value) {
                    char.value = '';
                } else if (char.index > 0) {
                    const prev = chars[char.index - 1];
                    prev.focus();
                    if (prev.value) {
                        prev.value = '';
                    }
                }
            } else if (e.key === 'Delete') {
                if (char.value) {
                    char.value = '';
                }
            } else if (e.key.length === 1) {
                let valid = false;

                if (char.getAttribute('inputmode') === 'numeric') {
                    valid = isNumeric(e.key);                    
                } else {
                    valid = isAlphanumeric(e.key);
                }
                if (valid) {
                    char.value = e.key.toUpperCase();
                    if (char.index < chars.length - 1) {
                        chars[char.index + 1].focus();
                    }
                } else {
                    console.log(`Invalid key press on character-by-character form input: ${e.key}`);
                }
            } else if (e.key === 'ArrowRight') {
                if (char.index < chars.length - 1) {
                    chars[char.index + 1].focus();
                }          
            } else if (e.key === 'ArrowLeft') {
                if (char.index > 0) {
                    chars[char.index - 1].focus();
                }  
            } else if (e.key === 'Enter') {
                // If there's a blank, select it.
                let allset = true;
                for (const c of chars) {
                    if (!c.value) {
                        c.focus();
                        e.preventDefault();
                        return false;
                    }
                }
                // Otherwise, allow the submit to happen.
                return false;
            } else {
                console.log(`Unhandled key press on character-by-character form input: ${e.key}`);
            }
            e.preventDefault();
            return false;
        }
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            
            char.index = i;
            char.addEventListener('keydown', processKeypress);
            char.addEventListener('input', processInput);
        }
    }
}
//#endregion Password Widgets

//#region Fold-Outs
{
    const folds = document.getElementsByClassName('fold-out');

    function toggleFold(e) {
        const parent = e.currentTarget.parentElement;
        if (parent.classList.contains('collapsed')) {
            parent.classList.remove('collapsed');
        } else {
            parent.classList.add('collapsed');
        }
    }

    for (const fold of folds) {
        const header = fold.getElementsByTagName('header')[0];
        header.addEventListener('click', toggleFold);
    }
}
//#endregion Fold-Outs

//#region Variable Storage
let storage;
let storageError = 'Storage unavailable';

{
    // Validate storage:
    // Adapted from MDN example.
    function tryUseStorage(storageType)  {
        try {
            storage = window[storageType];
            if (!storage) return false;
            const x = '__storage_test__';
            storage.setItem[x, x];
            storage.removeItem(x);
            return true;
        } catch (e) {
            storageError = e.message;
            return false;
        }
    }

    if (!tryUseStorage('localStorage')) {
        if (!tryUseStorage('sessionStorage'))
            storage = false;
    }
}

const puzvarKey = 'puzzleVariables';
let puzvars = {};
if (storage) { 
    const varText = storage.getItem(puzvarKey);
    if (varText) {
        puzvars = JSON.parse(varText);
    }
}

function saveAllVariables(onError) {
    if (!storage) {
        onError(storageError);
        return false;
    }
    try {
        storage.setItem(puzvarKey, JSON.stringify(puzvars));
    } catch (e) {
        onError(e.message);
        return false;
    }
    return true;
}

function setVar(key, value, onError) {
    if (!storage) {
        onError(storageError);
        return false;
    }

    puzvars[key] = value;
    return saveAllVariables(onError);
}

function getVar(key, defaultValue, onError) {
    if (!storage) {
        onError(storageError)
        return false;
    }

    if (key in puzvars) return puzvars[key];
    return defaultValue;
}

function unsetVar(key, onError) {
    if (!storage) {
        onError(storageError);
        return false;
    }

    delete puzvars[key];
    return saveAllVariables(onError);
}

function clearAllVariables() {
    if (!storage) return;

    puzvars = {};
    storage.remove(puzvarKey);
}
//#endregion Variable Storage


export {stagedReveal, passphraseForms, setVar, getVar, unsetVar, clearAllVariables};