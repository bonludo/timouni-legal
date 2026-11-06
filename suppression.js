// Timouni — suppression du compte sans l'application (page « Supprimer mes données »).
// 1. le parent donne son e-mail → Supabase envoie un code à 6 chiffres (jamais de création de compte) ;
// 2. il saisit le code → session temporaire ;
// 3. on regarde s'il a un abonnement en cours (pour le prévenir), il confirme ;
// 4. la fonction serveur « supprimer-compte » efface tout, puis la session est oubliée.
// Aucune dépendance : appels HTTP directs. La clé publique est publique par nature (règles RLS côté base).
(() => {
  const PROJET = 'https://yqaufmmzdgfthhwewlbx.supabase.co';
  const CLE = 'sb_publishable_z4x6qRgA9AHedfVo2ud66A_WGEhgOeI';
  const TXT = {
    fr: {
      envoi: 'Envoi…', verif: 'Vérification…', suppr: 'Suppression…',
      emailInvalide: 'Vérifiez l’adresse e-mail.',
      codeEnvoye: 'Si un compte Timouni est protégé par cette adresse, un code à 6 chiffres vient d’y être envoyé. Pensez à regarder dans les indésirables.',
      tropVite: 'Trop de demandes. Patientez quelques minutes avant de réessayer.',
      codeInvalide: 'Ce code ne fonctionne pas ou a expiré. Vérifiez-le, ou demandez-en un nouveau.',
      abo: 'Un abonnement Timouni est en cours sur ce compte. La suppression ne l’arrête pas : il est facturé par Apple ou Google. Pensez à le résilier dans les réglages de votre appareil (voir la page Assistance).',
      sansAbo: 'Compte trouvé. La suppression est définitive.',
      fini: 'C’est fait : le compte et toutes ses données ont été supprimés. Pensez aussi à désinstaller l’application de vos appareils pour effacer ce qui y est enregistré.',
      erreur: 'La suppression n’a pas pu aboutir. Réessayez plus tard ou écrivez à contact@timouni.com.',
      reseau: 'Connexion impossible. Vérifiez votre accès à Internet et réessayez.',
    },
    en: {
      envoi: 'Sending…', verif: 'Checking…', suppr: 'Deleting…',
      emailInvalide: 'Please check the email address.',
      codeEnvoye: 'If a Timouni account is protected by this address, a 6-digit code has just been sent to it. Remember to check your spam folder.',
      tropVite: 'Too many requests. Please wait a few minutes and try again.',
      codeInvalide: 'This code doesn’t work or has expired. Check it, or ask for a new one.',
      abo: 'A Timouni subscription is active on this account. Deleting the account does not stop it: it is billed by Apple or Google. Remember to cancel it in your device settings (see the Support page).',
      sansAbo: 'Account found. Deletion is permanent.',
      fini: 'Done: the account and all its data have been deleted. You can also uninstall the app from your devices to erase what is stored there.',
      erreur: 'The deletion could not be completed. Please try again later or email contact@timouni.com.',
      reseau: 'Could not connect. Check your internet access and try again.',
    },
  };

  const appel = async (chemin, corps, jeton) => {
    const r = await fetch(PROJET + chemin, {
      method: corps === undefined ? 'GET' : 'POST',
      headers: { apikey: CLE, 'Content-Type': 'application/json', ...(jeton ? { Authorization: 'Bearer ' + jeton } : {}) },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
    let donnees = null;
    try { donnees = await r.json(); } catch { /* corps vide */ }
    return { ok: r.ok, status: r.status, donnees };
  };

  document.querySelectorAll('.form-suppression').forEach((bloc) => {
    const t = TXT[bloc.closest('[lang]')?.lang === 'en' ? 'en' : 'fr'];
    const $ = (s) => bloc.querySelector(s);
    const etapes = { email: $('.etape-email'), code: $('.etape-code'), confirmer: $('.etape-confirmer'), fini: $('.etape-fini') };
    const message = $('.message');
    let email = '', jeton = '';

    const montrer = (nom) => Object.entries(etapes).forEach(([n, el]) => { el.hidden = n !== nom; });
    const dire = (texte, alerte = false) => { message.textContent = texte; message.classList.toggle('alerte', alerte); };
    const occupe = (bouton, texte) => { const avant = bouton.textContent; bouton.disabled = true; bouton.textContent = texte; return () => { bouton.disabled = false; bouton.textContent = avant; }; };

    etapes.email.addEventListener('submit', async (e) => {
      e.preventDefault();
      email = $('input[type=email]').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return dire(t.emailInvalide, true);
      const fin = occupe(e.submitter || $('.etape-email button'), t.envoi);
      try {
        const r = await appel('/auth/v1/otp', { email, create_user: false });
        // Même réponse que le compte existe ou non : on ne révèle pas qui a un compte.
        if (r.status === 429) { dire(t.tropVite, true); return; }
        dire(t.codeEnvoye);
        montrer('code');
        $('.etape-code input').focus();
      } catch { dire(t.reseau, true); } finally { fin(); }
    });

    $('.autre-code').addEventListener('click', () => { montrer('email'); dire(''); });

    etapes.code.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = $('.etape-code input').value.replace(/\D/g, '');
      const fin = occupe(e.submitter || $('.etape-code button[type=submit]'), t.verif);
      try {
        const r = await appel('/auth/v1/verify', { type: 'email', email, token: code });
        if (!r.ok || !r.donnees?.access_token) { dire(t.codeInvalide, true); return; }
        jeton = r.donnees.access_token;
        const abo = await appel('/rest/v1/subscriptions?select=status,expires_at', undefined, jeton);
        const actif = abo.ok && Array.isArray(abo.donnees) && abo.donnees.some((a) =>
          a.status !== 'expired' && a.status !== 'cancelled' && (!a.expires_at || new Date(a.expires_at) > new Date()));
        dire(actif ? t.abo : t.sansAbo, actif);
        montrer('confirmer');
      } catch { dire(t.reseau, true); } finally { fin(); }
    });

    const caseOk = $('.etape-confirmer input[type=checkbox]');
    const boutonSuppr = $('.etape-confirmer button');
    caseOk.addEventListener('change', () => { boutonSuppr.disabled = !caseOk.checked; });

    etapes.confirmer.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!caseOk.checked) return;
      const fin = occupe(boutonSuppr, t.suppr);
      try {
        const r = await appel('/functions/v1/supprimer-compte', {}, jeton);
        if (!r.ok) { dire(r.donnees?.erreur || t.erreur, true); fin(); return; }
        jeton = '';
        dire('');
        etapes.fini.textContent = t.fini;
        montrer('fini');
      } catch { dire(t.reseau, true); fin(); }
    });
  });
})();
