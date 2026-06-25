const DEFAULT_REVEAL_DELAY = 500;
let revealtime = DEFAULT_REVEAL_DELAY;

function stagedReveal() {
   const revelations = Array.from(document.getElementsByClassName('toreveal')).filter(element => !element.classList.contains('hidden'));
   const count = revelations.length;

   if (count < 1) {
    revealtime = DEFAULT_REVEAL_DELAY;
    return;
   }

   revelations[0].classList.remove('toreveal');

   revealtime += 200;

   if (count > 1) setTimeout(stagedReveal, revealtime)
   else revealtime = DEFAULT_REVEAL_DELAY;
}

setTimeout(stagedReveal, revealtime);

function isNumeric(c) {

}

function isAlphanumeric(c) {
    const code = c.charCodeAt(0);
    return (code > 47 && code < 58)   // numbers 0-9
        || (code > 64 && code < 91)   // uppercase A-Z
        || (code > 96 && code < 123); // lowercase a-z
}

const passphraseForms = {};
{    
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
            console.log('checking answer...')
            if (typeof(answer) === 'string') {
                answer = answer.trim().toUpperCase();
                const text = form.getValue().trim().toUpperCase();
                if (text === answer) {
                    console.log(`Submitted answer '${text}' is correct!`);
                    return true;
                }
                if (!silent)
                    console.log(`Submitted answer '${text}' does not match the correct answer.`);
                return false;
            }
            
            if (Array.isArray(answer)) {
                for(const value of answer) {
                    if (form.checkAnswer(value, true)) {
                        return true;
                    }
                }
                console.log(`Submitted answer '${text}' does not match any of the correct answers.`);
                return false;
            }

            // Otherwise, assume answer is a regular expression.
            if (typeof(answer) === 'object' && 'test' in answer.keys) {
                const text = form.getValue().trim().toUpperCase();
                if (answer.test(text)) {
                    console.log(`Submitted answer '${text}' correctly matches the pattern!`);
                } else {
                    console.log(`Submitted answer '${text}' does not match the answer pattern.`);
                }
            }

            console.log('Unsupported answer type:', answer);
        }

        const processKeypress = (e) => {
            const char = e.currentTarget;
            if (e.key === 'Backspace') {
                if (char.value) {
                    console.log('Erasing:', char.value, char.value.charCodeAt(0));
                    char.value = '';
                } else if (char.index > 0) {
                    console.log('Erasing nothing:', char.value, char.value.charCodeAt(0));
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

                if (char.type === 'number' && isNumeric(e.key)) {
                    valid = true;                    
                } else if (char.type === 'text' && isAlphanumeric(e.key)) {
                    valid = true;
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
            if (i < char.length-1) {
                
            }
        }
    }
}

{
    const folds = document.getElementsByClassName('fold-out');

    function toggleFold(e) {
        console.log('Toggling fold');
        const parent = e.currentTarget.parentElement;
        if (parent.classList.contains('collapsed')) {
            parent.classList.remove('collapsed');
        } else {
            parent.classList.add('collapsed');
        }
    }

    for (const fold of folds) {
        const header = fold.getElementsByTagName('header')[0];
        console.log('adding foldout handler to', header);
        header.addEventListener('click', toggleFold);
    }
}

export {stagedReveal, passphraseForms};