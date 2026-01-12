// ReadyPlayerMe Blendshape Keys
export const RPM_TARGETS = {
  sil: 'viseme_sil',
  aa: 'viseme_aa',
  E: 'viseme_E',
  I: 'viseme_I',
  O: 'viseme_O',
  U: 'viseme_U',
  PP: 'viseme_PP',
  FF: 'viseme_FF',
  TH: 'viseme_TH',
  DD: 'viseme_DD',
  kk: 'viseme_kk',
  CH: 'viseme_CH',
  SS: 'viseme_SS',
  nn: 'viseme_nn',
  RR: 'viseme_RR'
};

// Heuristic Map: ElevenLabs char -> RPM Target
export const mapCharToViseme = (char: string) => {
    const c = char.toLowerCase();
    if (/[aeh]/.test(c)) return RPM_TARGETS.aa;
    if (/[i]/.test(c)) return RPM_TARGETS.I;
    if (/[o]/.test(c)) return RPM_TARGETS.O;
    if (/[uyw]/.test(c)) return RPM_TARGETS.U;
    if (/[bmp]/.test(c)) return RPM_TARGETS.PP;
    if (/[fv]/.test(c)) return RPM_TARGETS.FF;
    if (/[dt]/.test(c)) return RPM_TARGETS.DD;
    if (/[kgl]/.test(c)) return RPM_TARGETS.kk;
    if (/[r]/.test(c)) return RPM_TARGETS.RR;
    if (/[s]/.test(c)) return RPM_TARGETS.SS;
    return RPM_TARGETS.sil;
};