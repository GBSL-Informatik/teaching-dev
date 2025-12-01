from browser import window, alert

def languages(print_langs=True):
    langs = []
    browser_langs = window.speechSynthesis.getVoices()
    # some browsers return empty list at first call
    if len(browser_langs) == 0:
        t0 = window.performance.now()
        while window.performance.now() - t0 < 1000 and window.speechSynthesis.getVoices().length == 0:
            pass
        browser_langs = window.speechSynthesis.getVoices()
    if len(browser_langs) == 0:
        alert('Stimmen werden im Hintergrund heruntergeladen, versuchen Sie es in einigen Sekunden nochmals.')
    for v in browser_langs:
        if v.lang not in langs:
            langs.append(v.lang)
            if print_langs:
                print(v.lang) 
    return langs

def sanitize_lang(lang):
    langs = languages(print_langs=False)
    if lang in langs:
        return lang
    
    if len(langs) == 0:
        raise RuntimeError('No languages available in your browser - try another browser')
    if 'en-US' in langs:
        print(f'Language {lang} not supported, using en-US instead')
        return 'en-US'
    else:
        print(f'Language {lang} not supported, using {langs[0]} instead')
        return langs[0]


def voices(lang='de-CH', print_langs=True):
    lang = sanitize_lang(lang)
    _voices = [v.name for v in window.speechSynthesis.getVoices() if v.lang.startswith(lang)]
    for voice in _voices:
        print(voice)
    return _voices

def get_voice(voice, lang='de-CH'):
    _voices = voices(lang, print_langs=False)
    if voice not in _voices:
        if len(_voices) == 0:
            raise RuntimeError(f'No voices available for language {lang}')
        if 'en-US' in _voices:
            print(f'Voice {voice} not found, using en-US instead')
            voice = 'en-US'
        else:
            print(f'Voice {voice} not found, using {_voices[0]} instead')
            voice = _voices[0]
    return next(filter(lambda v: v.name == voice, window.speechSynthesis.getVoices()))

def speak(text: str, lang='de-CH', volume=1, rate=1, pitch=1, voice=None, ):
    utterance = window.SpeechSynthesisUtterance.new(text)
    utterance.lang = sanitize_lang(lang)
    utterance.volume = volume 
    utterance.rate = rate
    utterance.pitch = pitch
    if voice:
        utterance.voice = get_voice(voice, lang=lang)
    window.speechSynthesis.speak(utterance)