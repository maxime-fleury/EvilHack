export type Lang = "en" | "fr";

export interface Bilingual {
  en: string;
  fr: string;
}

export function pick(lang: Lang, b: Bilingual | undefined, fallback = ""): string {
  if (!b) return fallback;
  return b[lang] ?? b.en;
}

/** Translate a catalog key with {var} substitution. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = CAT[key];
  const tmpl = entry ? (entry[lang] ?? entry.en) : key;
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => String(vars?.[k] ?? `{${k}}`));
}

// ── Command / UI message catalog ───────────────────────────────────────────

const CAT: Record<string, Bilingual> = {
  // help / generic
  "help.title": { en: "Commands", fr: "Commandes" },
  "help.nav": { en: "Navigation", fr: "Navigation" },
  "help.hacking": { en: "Hacking", fr: "Piratage" },
  "help.economy": { en: "Economy", fr: "Économie" },
  "help.intel": { en: "Intelligence", fr: "Renseignements" },
  "help.system": { en: "System", fr: "Système" },
  "help.tip": { en: "Tip: use Tab to autocomplete. Type a command and hit Enter.", fr: "Astuce : utilisez Tab pour l'autocomplétion. Tapez une commande puis Entrée." },
  "help.noSuch": { en: "No such command: '{cmd}'.", fr: "Commande inconnue : '{cmd}'." },
  "help.usage": { en: "usage: {usage}", fr: "usage : {usage}" },
  "help.aliases": { en: "aliases: {a}", fr: "alias : {a}" },
  "cmd.unknown": { en: "Unknown command: '{name}'. Type 'help' for a list of commands.", fr: "Commande inconnue : '{name}'. Tapez 'help' pour la liste des commandes." },
  "cmd.error": { en: "Something went wrong: {msg}", fr: "Quelque chose s'est mal passé : {msg}" },
  "time.elapsed": { en: "⏱  {m} min elapsed", fr: "⏱  {m} min écoulées" },

  // stats
  "stats.sheet": { en: "{name}'s Laptop — 'Frank'", fr: "L'ordinateur de {name} — « Frank »" },
  "stats.hardware": { en: "Hardware", fr: "Matériel" },
  "stats.derived": { en: "Derived", fr: "Dérivés" },
  "stats.cpu": { en: "CPU: {cpu} (power {p})", fr: "CPU : {cpu} (puissance {p})" },
  "stats.gpu": { en: "GPU: {gpu} (mining {r}/hr)", fr: "GPU : {gpu} (minage {r}/h)" },
  "stats.ram": { en: "RAM: {n} extra slot(s) → {slots} parallel hack(s)", fr: "RAM : {n} emplacement(s) en plus → {slots} hack(s) en parallèle" },
  "stats.vpn": { en: "VPN: {vpn} (heat ×{m})", fr: "VPN : {vpn} (chaleur ×{m})" },
  "stats.botnet": { en: "Botnet: {b}", fr: "Botnet : {b}" },
  "stats.vps": { en: "VPS: {v}", fr: "VPS : {v}" },
  "stats.exploits": { en: "Exploits: {e}", fr: "Exploits : {e}" },
  "stats.hacktime": { en: "Avg hack time for difficulty 3: ~{m} min", fr: "Temps de hack moyen (difficulté 3) : ~{m} min" },
  "stats.mining": { en: "Mining: {state} @ {r}/hr", fr: "Minage : {state} à {r}/h" },
  "stats.puppy": { en: "PUPPYCOIN: {owned} @ {price} = {value}", fr: "PUPPYCOIN : {owned} à {price} = {value}" },
  "stats.title": { en: "Title: {title}", fr: "Titre : {title}" },

  // scan
  "scan.title": { en: "SCAN — nearby networks", fr: "SCAN — réseaux à proximité" },
  "scan.noTarget": { en: "No target named '{name}'. Try 'scan'.", fr: "Aucune cible nommée « {name} ». Essayez 'scan'." },
  "scan.difficulty": { en: "difficulty: {bars}", fr: "difficulté : {bars}" },
  "scan.eta": { en: "est. time: ~{m} min", fr: "temps estimé : ~{m} min" },
  "scan.mission": { en: "This is a mission target. Hack it to progress.", fr: "C'est une cible de mission. Piratez-la pour progresser." },
  "scan.payout": { en: "payout (skim): ~{lo}–{hi}", fr: "paiement (butin) : ~{lo}–{hi}" },
  "scan.heat": { en: "heat risk: +{h}", fr: "risque de chaleur : +{h}" },
  "scan.hint": { en: "Hack one with: hack <target>", fr: "Piratez-en une avec : hack <cible>" },

  // hack
  "hack.usage": { en: "Usage: hack <target>. Run 'scan' to see targets.", fr: "Usage : hack <cible>. Faites 'scan' pour voir les cibles." },
  "hack.laylow": { en: "You're laying low until Day {d}. No crime. Only vibes.", fr: "Vous vous cachez jusqu'au jour {d}. Pas de crime. Que des bonnes ondes." },
  "hack.noTarget": { en: "No target named '{name}'. Run 'scan' to see what's out there.", fr: "Aucune cible nommée « {name} ». Faites 'scan' pour voir ce qui traîne." },
  "hack.botnet": { en: "You need a botnet for this one. Check the shop: buy bot1.", fr: "Il vous faut un botnet pour celle-ci. Voir la boutique : buy bot1." },
  "hack.slots": { en: "All {n} parallel slot(s) busy. Wait for a hack to finish or buy more RAM.", fr: "Les {n} emplacement(s) parallèles sont occupés. Attendez la fin d'un hack ou achetez plus de RAM." },
  "hack.started": { en: "🔓 Target acquired: {t}", fr: "🔓 Cible acquise : {t}" },
  "hack.diff": { en: "difficulty {d}/5 · ETA ~{m} min", fr: "difficulté {d}/5 · délai ~{m} min" },
  "hack.running": { en: "Running {a}/{n} parallel hack(s).", fr: "{a}/{n} hack(s) en cours." },
  "hack.bg": { en: "Job started. It runs in the background — your other commands advance the clock.", fr: "Tâche lancée. Elle tourne en arrière-plan — vos autres commandes font avancer l'horloge." },
  "hack.done": { en: "✔ {label} — complete.", fr: "✔ {label} — terminé." },
  "hack.skimmed": { en: "skimmed {m} from {target}.", fr: "{m} récupérés sur {target}." },
  "hack.fragment": { en: "📄 found a dossier fragment on {npc} ({f}/3).", fr: "📄 fragment de dossier trouvé sur {npc} ({f}/3)." },
  "hack.heat": { en: "heat +{h}", fr: "chaleur +{h}" },
  "hack.missionDone": { en: "Mission objective complete: {title}. Run `missions deliver {id}`.", fr: "Objectif de mission terminé : {title}. Faites `missions deliver {id}`." },

  // missions
  "mis.usageAccept": { en: "Usage: missions accept <id>", fr: "Usage : missions accept <id>" },
  "mis.usageDeliver": { en: "Usage: missions deliver <id>", fr: "Usage : missions deliver <id>" },
  "mis.none": { en: "No mission #{id}.", fr: "Pas de mission #{id}." },
  "mis.notAvail": { en: "Mission #{id} is not available (status: {s}).", fr: "La mission #{id} n'est pas disponible (statut : {s})." },
  "mis.needBotnet": { en: "This mission needs a botnet. Check the shop: buy bot1.", fr: "Cette mission nécessite un botnet. Voir la boutique : buy bot1." },
  "mis.needExploit": { en: "This mission needs the '{e}' exploit. Check the shop.", fr: "Cette mission nécessite l'exploit « {e} ». Voir la boutique." },
  "mis.accepted": { en: "Mission accepted: {title}", fr: "Mission acceptée : {title}" },
  "mis.target": { en: "Target: {t} — it's now in your scan list.", fr: "Cible : {t} — elle est maintenant dans votre liste de scan." },
  "mis.deadline": { en: "Deadline: {d} (no rush, but don't be late)", fr: "Échéance : {d} (pas de panique, mais ne soyez pas en retard)" },
  "mis.notActive": { en: "Mission #{id} isn't active.", fr: "La mission #{id} n'est pas active." },
  "mis.hackFirst": { en: "You haven't hacked the target yet. Hack it first, then deliver.", fr: "Vous n'avez pas encore piraté la cible. Hackez d'abord, puis livrez." },
  "mis.complete": { en: "✔ Mission complete: {title}", fr: "✔ Mission terminée : {title}" },
  "mis.reward": { en: "+{money} · rep +{r} · style +{s}", fr: "+{money} · réputation +{r} · style +{s}" },
  "mis.heatWarn": { en: "That one got some attention. Watch your heat.", fr: "Celle-là a attiré l'attention. Surveillez votre chaleur." },
  "mis.offers": { en: "New offers: {n}.", fr: "Nouvelles offres : {n}." },
  "mis.nothingNew": { en: "nothing new right now", fr: "rien de nouveau pour l'instant" },
  "mis.available": { en: "Available missions", fr: "Missions disponibles" },
  "mis.active": { en: "Active", fr: "Actives" },
  "mis.history": { en: "History", fr: "Historique" },
  "mis.noOffers": { en: "No missions available right now. Do some hacks to raise your rep, then 'missions offer'.", fr: "Aucune mission disponible. Faites des hacks pour augmenter votre réputation, puis 'missions offer'." },
  "mis.deadlineWarn": { en: "deadline: Day {d}", fr: "échéance : jour {d}" },
  "mis.deliverHint": { en: "→ missions deliver {id} (when done)", fr: "→ missions deliver {id} (quand c'est fait)" },
  "mis.failed": { en: "[MISSION FAILED] {title} — {why}", fr: "[MISSION ÉCHOUÉE] {title} — {why}" },
  "mis.twist": { en: "MAIS NON! — THE TWIST", fr: "MAIS NON ! — LE REBONDISSEMENT" },
  "mis.twistChoose": { en: "→ missions deliver {id} <a|b|c> to choose. Choose wisely. Or don't. It's your karma.", fr: "→ missions deliver {id} <a|b|c> pour choisir. Choisissez bien. Ou pas. C'est votre karma." },
  "mis.twistBad": { en: "Pick a real option: {keys}", fr: "Choisissez une vraie option : {keys}" },
  "mis.twistDone": { en: "⚖ {title} — the choice is made", fr: "⚖ {title} — le choix est fait" },

  // buy / shop
  "shop.title": { en: "THE SHOP — 'Dank Deals'", fr: "LA BOUTIQUE — « Bonnes Affaires »" },
  "shop.jerry": { en: "You're pretty sure this store is just a guy named Jerry in a trench coat.", fr: "Vous êtes presque sûr que cette boutique est juste un type nommé Jerry en trench-coat." },
  "shop.buyWith": { en: "Buy with: buy <id>", fr: "Achetez avec : buy <id>" },
  "shop.noItem": { en: "No item '{id}'. Run 'buy' to see the shop.", fr: "Objet inconnu : « {id} ». Faites 'buy' pour voir la boutique." },
  "shop.notEnough": { en: "You need {need}. You have {have}. Jerry is not impressed.", fr: "Il vous faut {need}. Vous avez {have}. Jerry n'est pas impressionné." },
  "shop.better": { en: "You already have a better {slot} than that. Jerry shakes his head.", fr: "Vous avez déjà un meilleur {slot} que ça. Jerry secoue la tête." },
  "shop.owned": { en: "You already own {name}. Read it again, maybe.", fr: "Vous possédez déjà {name}. Relisez-le, peut-être." },
  "shop.oneIsEnough": { en: "You already have a {name}. One is enough.", fr: "Vous avez déjà un(e) {name}. Un(e) suffit." },
  "shop.purchased": { en: "Purchased: {name}", fr: "Acheté : {name}" },
  "shop.balance": { en: "-{price}  (balance {bal})", fr: "-{price}  (solde {bal})" },
  "shop.installed": { en: "Installed. {effect}.", fr: "Installé. {effect}." },
  "shop.rgb": { en: "+50 style. Your laptop now looks like a rave. Efficiency is a state of mind.", fr: "+50 style. Votre ordinateur ressemble à une rave. L'efficacité est un état d'esprit." },
  "shop.chair": { en: "+30 style. You are now 12% faster at spinning in your chair.", fr: "+30 style. Vous êtes désormais 12% plus rapide pour tourner sur votre chaise." },
  "shop.toaster": { en: "+mining, +heat. The toaster gets warm. So does your apartment. So do you.", fr: "+minage, +chaleur. Le grille-pain chauffe. Votre appartement aussi. Vous aussi." },
  "shop.cam": { en: "-style. The camera watches the empty room. You watch the camera. It's a stare-down.", fr: "-style. La caméra surveille la pièce vide. Vous regardez la caméra. C'est un duel de regards." },
  "inv.title": { en: "{name}'s gear", fr: "L'équipement de {name}" },
  "inv.lifestyle": { en: "Lifestyle: {l}", fr: "Style de vie : {l}" },
  "inv.nothing": { en: "nothing. your room is a void of beige.", fr: "rien. votre chambre est un vide beige." },
  "inv.upgrade": { en: "Upgrade with: buy <id>", fr: "Améliorez avec : buy <id>" },

  // sell / people
  "people.title": { en: "People of interest", fr: "Personnes d'intérêt" },
  "people.nobody": { en: "Nobody yet. Hack some networks — you might dig up dirt on people.", fr: "Personne pour l'instant. Piratez des réseaux — vous pourriez dénicher des secrets." },
  "people.sold": { en: "SOLD", fr: "VENDU" },
  "people.ready": { en: "ready to sell", fr: "prêt à vendre" },
  "people.hint": { en: "hint: hack {e}, check the news…", fr: "indice : hackez {e}, regardez les infos…" },
  "sell.usage": { en: "Usage: sell <npc-id>. Run 'people' to see dossiers.", fr: "Usage : sell <npc-id>. Faites 'people' pour voir les dossiers." },
  "sell.noNpc": { en: "No such person: '{n}'. Run 'people'.", fr: "Personne inconnue : « {n} ». Faites 'people'." },
  "sell.noDossier": { en: "You don't have a full dossier on {n} yet ({f}/3 fragments).", fr: "Vous n'avez pas encore le dossier complet sur {n} ({f}/3 fragments)." },
  "sell.sold": { en: "You already sold {n}. The Daily Leak wants fresh meat.", fr: "Vous avez déjà vendu {n}. The Daily Leak veut de la viande fraîche." },
  "sell.ok": { en: "📰 Sold {n}'s dossier to The Daily Leak.", fr: "📰 Dossier de {n} vendu à The Daily Leak." },
  "sell.money": { en: "+{m} (juicy: {j} × rep bonus)", fr: "+{m} (juteux : {j} × bonus réputation)" },
  "sell.pierre": { en: "…a message arrives in Comic Sans: 'dude. that was ME. i'm literally 14. i'm telling my mom.'", fr: "…un message arrive en Comic Sans : « mec. c'était MOI. j'ai littéralement 14 ans. je le dis à ma mère. »" },
  "sell.pierreRep": { en: "rep -5. You sold out a 14-year-old. Pierre's mom is disappointed in you.", fr: "réputation -5. Vous avez vendu un ado de 14 ans. La mère de Pierre est déçue de vous." },
  "sell.kowalski": { en: "Agent Kowalski is 'very impressed' with your audacity. He's also 'very busy' with raid night.", fr: "L'agent Kowalski est « très impressionné » par votre audace. Il est aussi « très occupé » par sa soirée raid." },
  "sell.newsTitle": { en: "The Daily Leak publishes bombshell on {n}", fr: "The Daily Leak publie une bombe sur {n}" },

  // news
  "news.title": { en: "THE DAILY LEAK — headlines", fr: "THE DAILY LEAK — à la une" },
  "news.nothing": { en: "Nothing yet. The world is suspiciously quiet. That can't last.", fr: "Rien pour l'instant. Le monde est étrangement calme. Ça ne peut pas durer." },

  // search
  "search.title": { en: "SEARCH: '{term}'", fr: "RECHERCHE : « {term} »" },
  "search.none": { en: "No results for '{term}'. The void stares back.", fr: "Aucun résultat pour « {term} ». Le vide vous regarde." },
  "search.hits": { en: "Matches for '{term}' highlighted above.", fr: "Correspondances pour « {term} » surlignées ci-dessus." },
  "search.log": { en: "Event log (recent)", fr: "Journal des événements (récent)" },
  "search.nolog": { en: "Nothing logged yet. Go do something slightly illegal.", fr: "Rien de journalisé. Allez faire quelque chose de légèrement illégal." },
  "search.hint": { en: "Search it with: search <term> (matches get highlighted)", fr: "Cherchez avec : search <terme> (les correspondances sont surlignées)" },

  // miner
  "miner.usage": { en: "miner [start|stop|status]", fr: "miner [start|stop|status]" },
  "miner.start": { en: "⛏  Mining resumed. {r}/hr. The fans spin up. The room gets warmer.", fr: "⛏  Minage repris. {r}/h. Les ventilateurs s'affolent. La pièce se réchauffe." },
  "miner.stop": { en: "Mining stopped. Your GPU rests. It dreams of the benchmark it will never run.", fr: "Minage arrêté. Votre GPU se repose. Il rêve du benchmark qu'il ne fera jamais." },
  "miner.title": { en: "CRYPTO RIG", fr: "FERME DE MINAGE" },
  "miner.status": { en: "Status: {s}", fr: "Statut : {s}" },
  "miner.rate": { en: "Rate: {r}/hr", fr: "Cadence : {r}/h" },
  "miner.toaster": { en: "+ Crypto Toaster (it's toasting. it's mining. it's confused.)", fr: "+ Crypto Grille-pain (il grille. il mine. il est perdu.)" },
  "miner.honest": { en: "It's not much, but it's honest work. Upgrade your GPU to earn more.", fr: "Ce n'est pas grand-chose, mais c'est un travail honnête. Améliorez votre GPU pour gagner plus." },

  // coin
  "coin.price": { en: "PUPPYCOIN: {p}/coin", fr: "PUPPYCOIN : {p}/pièce" },
  "coin.moon": { en: "It's going to the moon. It has been saying this since 2021.", fr: "Ça va aller sur la Lune. Ça le dit depuis 2021." },
  "coin.buyUsage": { en: "Usage: coin buy <amount-in-dollars>", fr: "Usage : coin buy <montant-en-dollars>" },
  "coin.noMoney": { en: "You have {m}. PUPPYCOIN does not accept 'vibes'.", fr: "Vous avez {m}. PUPPYCOIN n'accepte pas les « bonnes ondes »." },
  "coin.bought": { en: "Bought {c} PUPPYCOIN for {m}.", fr: "{c} PUPPYCOIN achetés pour {m}." },
  "coin.dog": { en: "The coin's mascot (a dog) looks nervous.", fr: "La mascotte de la pièce (un chien) a l'air nerveuse." },
  "coin.none": { en: "You own no PUPPYCOIN. The dog is relieved.", fr: "Vous ne possédez aucun PUPPYCOIN. Le chien est soulagé." },
  "coin.sellUsage": { en: "Usage: coin sell <coins> | coin sell all", fr: "Usage : coin sell <pièces> | coin sell all" },
  "coin.sold": { en: "Sold {c} PUPPYCOIN for {m}.", fr: "{c} PUPPYCOIN vendus pour {m}." },
  "coin.profit": { en: "Profit. The dog is relieved. You are a financial genius.", fr: "Bénéfice. Le chien est soulagé. Vous êtes un génie financier." },
  "coin.lost": { en: "You lost money. The dog is sad. But it's a dog, so it's still happy.", fr: "Vous avez perdu de l'argent. Le chien est triste. Mais c'est un chien, donc il est content quand même." },
  "coin.wallet": { en: "PUPPYCOIN WALLET", fr: "PORTEFEUILLE PUPPYCOIN" },
  "coin.owned": { en: "Owned: {c} coins", fr: "Possédés : {c} pièces" },
  "coin.value": { en: "Value: {v}", fr: "Valeur : {v}" },
  "coin.actions": { en: "→ coin buy <$>  ·  coin sell <n>  ·  coin sell all", fr: "→ coin buy <$>  ·  coin sell <n>  ·  coin sell all" },
  "coin.disclaimer": { en: "Disclaimer: PUPPYCOIN is 'a meme, a dream, a lifestyle'. Not financial advice. Ever.", fr: "Avertissement : PUPPYCOIN est « un meme, un rêve, un style de vie ». Pas un conseil financier. Jamais." },

  // settings
  "settings.set": { en: "Settings updated: {k} = {v}", fr: "Paramètres mis à jour : {k} = {v}" },
  "settings.unknown": { en: "Unknown setting '{k}'. Try: {keys}", fr: "Paramètre inconnu « {k} ». Essayez : {keys}" },
  "settings.badValue": { en: "Invalid value '{v}' for {k}. Allowed: {allowed}", fr: "Valeur invalide « {v} » pour {k}. Autorisé : {allowed}" },
  "settings.usage": { en: "settings [set <key> <value>]", fr: "settings [set <clé> <valeur>]" },
  "settings.aiUsage": { en: "AI prompt (editable). This is the personality of your AI sidekick.", fr: "Prompt de l'IA (modifiable). C'est la personnalité de votre IA de compagnie." },
  "settings.badJson": { en: "Invalid JSON for set-all.", fr: "JSON invalide pour set-all." },
  "settings.aiHint": { en: "→ settings ai  (view/edit the AI sidekick's prompt)", fr: "→ settings ai  (voir/modifier le prompt de l'IA)" },

  // system
  "save.ok": { en: "State saved to SQLite. (It was already saved. Every command saves. You're welcome.)", fr: "État sauvegardé dans SQLite. (C'était déjà fait. Chaque commande sauvegarde. De rien.)" },
  "save.dim": { en: "Your life choices are now permanently recorded in a database file.", fr: "Vos choix de vie sont désormais enregistrés à jamais dans un fichier de base de données." },
  "reset.wipe": { en: "Wiping the database…", fr: "Effacement de la base de données…" },
  "reset.ok": { en: "Save wiped. Dave has no memory of the crimes. Frank has all of them.", fr: "Sauvegarde effacée. Dave n'a aucun souvenir des crimes. Frank les a tous." },
  "reset.again": { en: "Type 'help' to begin again.", fr: "Tapez 'help' pour recommencer." },
  "whoami.1": { en: "You are {name}.", fr: "Vous êtes {name}." },
  "whoami.2": { en: "Ex-devops. Unemployed. Bored. Capable of far worse than you've done so far. Mostly just tired.", fr: "Ex-devops. Au chômage. Ennuyé. Capable de bien pire que ce que vous avez fait jusqu'ici. Surtout fatigué." },
  "whoami.3": { en: "Frank (the laptop) is watching. Frank is always watching.", fr: "Frank (l'ordinateur) vous regarde. Frank regarde toujours." },
  "clear.hint": { en: "Wipes the visible terminal. Your crimes remain on the database, as they should.", fr: "Efface le terminal visible. Vos crimes restent dans la base de données, comme il se doit." },

  // login (no password — Frank doesn't believe in them)
  "login.welcome": { en: "Welcome, {name}.", fr: "Bienvenue, {name}." },
  "login.accepted": { en: "No password needed. Frank accepts you as you are. Noted: '{name}'. The crimes will follow.", fr: "Pas de mot de passe nécessaire. Frank vous accepte tel que vous êtes. Noté : « {name} ». Les crimes suivront." },
  "login.bad": { en: "That's not a name, that's a keyboard sneeze. Type your name:", fr: "Ce n'est pas un nom, c'est un éternuement de clavier. Tapez votre nom :" },
  "login.prompt": { en: "login:", fr: "connexion :" },

  // ai / chat
  "ai.offline": { en: "Noro-chan is offline (LM Studio not reachable). She'd tease you about it if she could.", fr: "Noro-chan est hors ligne (LM Studio injoignable). Elle vous taquinerait à ce sujet si elle pouvait." },
  "ai.cant": { en: "Hmm? Say that again~ I wasn't listening.", fr: "Hein ? Répète ça~ Je n'écoutais pas." },

  // tor
  "tor.title": { en: "TOR — The Onion Router (fake)", fr: "TOR — Le Routeur Oignon (faux)" },
  "tor.banner": { en: "You are now anonymous. Probably. Definitely not. But it feels cool.", fr: "Vous êtes désormais anonyme. Probablement. Sûrement pas. Mais ça fait classe." },
  "tor.sites": { en: "Hidden services", fr: "Services cachés" },
  "tor.visit": { en: "Visit one with: tor visit <site>", fr: "Visitez-en un avec : tor visit <site>" },
  "tor.noSite": { en: "No hidden service '{s}'. Run 'tor'.", fr: "Aucun service caché « {s} ». Faites 'tor'." },
  "tor.back": { en: "Type 'tor' to go back to the list.", fr: "Tapez 'tor' pour revenir à la liste." },
  "tor.install": { en: "Download one with: tor install <id>", fr: "Téléchargez-en un avec : tor install <id>" },
  "tor.installed": { en: "✔ Program downloaded: {name}", fr: "✔ Programme téléchargé : {name}" },
  "tor.scam": { en: "⚠ It was a scam! The file was a .bat that opened 400 browser windows of cat videos.", fr: "⚠ C'était une arnaque ! Le fichier était un .bat qui a ouvert 400 fenêtres de vidéos de chats." },
  "tor.noMoney": { en: "The seller sniffs. You don't have {m}.", fr: "Le vendeur renifle. Vous n'avez pas {m}." },
  "tor.needRep": { en: "The seller requires {r} rep. You have {have}.", fr: "Le vendeur exige {r} de réputation. Vous en avez {have}." },

  // choose / branching
  "choose.usage": { en: "Usage: choose <a|b|c>", fr: "Usage : choose <a|b|c>" },
  "choose.none": { en: "There's nothing to choose right now.", fr: "Il n'y a rien à choisir pour l'instant." },
  "choose.bad": { en: "Choose a, b or c.", fr: "Choisissez a, b ou c." },
  "choose.done": { en: "You chose: {choice}", fr: "Vous avez choisi : {choice}" },

  // vps
  "vps.unlock": { en: "VPS online! Your operations are now harder to trace. New offshore missions available.", fr: "VPS en ligne ! Vos opérations sont plus difficiles à tracer. De nouvelles missions offshore sont disponibles." },

  // heat events
  "heat.knock": { en: "🕵 You hear a knock at the door. Through the peephole: a man in a suit holding a folder labeled 'SUSPICIOUS ACTIVITY'.", fr: "🕵 On frappe à la porte. À travers le judas : un homme en costume tenant un dossier étiqueté « ACTIVITÉ SUSPECTE »." },
  "heat.bribe": { en: "You slipped him {m} in an envelope labeled 'consulting fee'. He nodded. He knows. He respects it.", fr: "Vous lui avez glissé {m} dans une enveloppe étiquetée « honoraires de conseil ». Il a hoché la tête. Il sait. Il respecte ça." },
  "heat.laylow": { en: "You can't afford the bribe. You'll lay low for {d} days. No crime. Only vibes (and mining).", fr: "Vous ne pouvez pas payer. Vous resterez planqué {d} jours. Pas de crime. Que des bonnes ondes (et du minage)." },
  "heat.paid": { en: "Paid a {m} 'consulting fee' to a man in a suit.", fr: "A payé des « honoraires de conseil » de {m} à un homme en costume." },
  "heat.hid": { en: "Forced to lay low after heat peaked.", fr: "Obligé de rester planqué après un pic de chaleur." },
  "laylow.done": { en: "You can show your face again. The heat died down. Mostly.", fr: "Vous pouvez réapparaître. La chaleur est retombée. En grande partie." },

  // branching story
  "branch.title": { en: "── [BRANCHING POINT] ──", fr: "── [POINT DE DIVERGENCE] ──" },
  "branch.msg1": { en: "Three factions are watching you: NullSec (the bored guild), The Syndicate (the scary ones), or… nobody.", fr: "Trois factions vous observent : NullSec (la guilde qui s'ennuie), Le Syndicat (les effrayants), ou… personne." },
  "branch.msg2": { en: "This shapes your future missions. Choose wisely (or don't, it's your life):", fr: "Cela orientera vos futures missions. Choisissez bien (ou pas, c'est votre vie) :" },
  "branch.msg3": { en: "   a) NullSec — guild missions, snacks included", fr: "   a) NullSec — missions de guilde, snacks inclus" },
  "branch.msg4": { en: "   b) The Syndicate — money, menace, mysterious salads", fr: "   b) Le Syndicat — argent, menace, salades mystérieuses" },
  "branch.msg5": { en: "   c) Solo — you against the world (and the world is losing)", fr: "   c) Solo — vous contre le monde (et le monde est en train de perdre)" },
  "branch.hint": { en: "   → type: choose a | choose b | choose c", fr: "   → tapez : choose a | choose b | choose c" },

  // story milestones
  "mil.nullsec1": { en: "A message appears in your terminal, typed in Comic Sans:", fr: "Un message apparaît dans votre terminal, tapé en Comic Sans :" },
  "mil.nullsec2": { en: "'hey. we're nullsec. we hack. you hack. you're bored. we're bored. let's be bored together.' — Pierre (xX_PhantomByte_Xx)", fr: "« salut. on est nullsec. on hack. tu hack. tu t'ennuies. on s'ennuie. ennuyons-nous ensemble. » — Pierre (xX_PhantomByte_Xx)" },
  "mil.nullsec2b": { en: "Pierre: 'wait. you're THE guy who kept MegaCorp's servers alive?? we call that 'doxxed but respected'. you're in.'", fr: "Pierre : « attends. t'es LE gars qui maintenait les serveurs de MegaCorp en vie ?? on appelle ça « doxxé mais respecté ». t'es dedans. »" },
  "mil.nullsec3": { en: "(Try `people` and `missions` — new opportunities await.)", fr: "(Essayez `people` et `missions` — de nouvelles opportunités vous attendent.)" },
  "mil.nullsecNews1": { en: "Mysterious message found in a packet of instant noodles", fr: "Message mystérieux trouvé dans un paquet de nouilles instantanées" },
  "mil.nullsecNews1b": { en: "'We've been watching you. Also, do you know how to do long division?' — signed, NullSec", fr: "« On vous observe. Et sinon, vous savez faire une division longue ? » — signé, NullSec" },
  "mil.nullsecMissions": { en: "Pierre: 'ok you're like, actually good. we're sending you real contracts now. don't mess it up or i'll tell my mom.'", fr: "Pierre : « ok t'es genre, vraiment bon. on t'envoie de vrais contrats maintenant. foire pas tout ou je le dis à ma mère. »" },
  "mil.nullsecNews2": { en: "NullSec expands operations, cites 'boredom' as primary motivator", fr: "NullSec étend ses opérations, cite « l'ennui » comme motivation principale" },
  "mil.nullsecNews2b": { en: "The collective has reportedly hired a 'very talented unemployed man'. Details are classified, as are the snacks.", fr: "Le collectif aurait recruté un « homme au chômage très talentueux ». Les détails sont classifiés, tout comme les snacks." },
  "mil.vault": { en: "Pierre: 'psst. the vault. ask around. it's where the cool stuff lives. also can you help me with my math homework.'", fr: "Pierre : « psst. la voûte. pose des questions. c'est là que vit le matos cool. et sinon tu peux m'aider pour mes devoirs de maths ? »" },

  // tor
  "tor.progs": { en: "For sale at the Bazaar:", fr: "En vente au Bazar :" },
  "tor.noProg": { en: "No program '{id}' at the Bazaar. Run 'tor visit bazaar'.", fr: "Pas de programme « {id} » au Bazar. Faites 'tor visit bazaar'." },
  "tor.haveProg": { en: "You already run {name}. It's watching you run it.", fr: "Vous utilisez déjà {name}. Il vous regarde l'utiliser." },
  "mis.offerNew": { en: "New offers arrived while you were busy.", fr: "De nouvelles offres sont arrivées pendant que vous étiez occupé." },

  // AI reactions to player actions (curated fallbacks, teasing)
  "ai.react.hack_done": { en: "Ooh, nice hack, Dave~ did you even try? No, wait, that was actually clean. I'm almost impressed.", fr: "Ooh, joli hack, Dave~ t'as même pas forcé ? Non attends, c'était propre, ça. Je suis presque impressionnée." },
  "ai.react.mission_done": { en: "Hehe~ mission done! You're basically a professional criminal now. Frank is proud. I'm… tolerating it.", fr: "Héhé~ mission terminée ! T'es officiellement un criminel professionnel. Frank est fier. Moi… je tolère." },
  "ai.react.heat_peak": { en: "Ummm Dave~ your heat is through the roof. The cops are probably updating their 'interesting people' folder. With your name in it.", fr: "Euh Dave~ ta chaleur est au max. Les flics sont probablement en train de mettre à jour leur dossier « gens intéressants ». Avec ton nom dedans." },
  "ai.react.big_purchase": { en: "Ohh~ spending the big bucks? Look at you, rich and dangerous. Don't forget the little people. (Me. I'm the little people.)", fr: "Ohh~ tu dépenses les gros sous ? Regarde-toi, riche et dangereux. N'oublie pas les petites gens. (Moi. Je suis les petites gens.)" },
  "ai.react.branch_chosen": { en: "You picked a side, huh~? Bold. I'll be watching to see if it was the right call. Spoiler: I already know, and I'm not telling.", fr: "Tu as choisi ton camp, hein~? Audacieux. Je vais surveiller si c'était le bon choix. Spoiler : je le sais déjà, et je te le dirai pas." },
  "ai.react.broke": { en: "Broke again, Dave~? It's almost an art form at this point. Maybe hack something? Just an idea. From the genius.", fr: "Fauché à nouveau, Dave~? C'est presque un art à ce stade. Hacke quelque chose, peut-être ? Juste une idée. De la génie." },
  "ai.react.first_hack": { en: "Your first hack~? So cute. Like a baby's first steps, but illegal and probably traced back to your kitchen.", fr: "Ton premier hack~? Trop mignon. Comme les premiers pas d'un bébé, mais illégal et probablement retracé jusqu'à ta cuisine." },
  "ai.react.big_payday": { en: "Ohhh~ look at the money! Don't spend it all on PUPPYCOIN. …Actually do. It's funnier.", fr: "Ohhh~ regarde-moi cet argent ! Le dépense pas tout en PUPPYCOIN. …En fait si. C'est plus drôle." },
  "ai.react.betrayal": { en: "…Wow. Dave. I saw that. You either just made a friend for life or an enemy for eternity. Frank beeped twice. He's invested now.", fr: "…Wow. Dave. J'ai vu ça. Tu viens de te faire un ami pour la vie ou un ennemi pour l'éternité. Frank a bipé deux fois. Il est investi, là." },
  "mis.failedLog": { en: "Mission failed: {title}", fr: "Mission échouée : {title}" },
  "mis.needVps": { en: "This mission needs a VPS (tier {v}+). Check the shop: buy vps{v}.", fr: "Cette mission nécessite un VPS (niveau {v}+). Voir la boutique : buy vps{v}." },
  "mis.whenever": { en: "whenever", fr: "quand vous voulez" },
  "mis.newsTitle": { en: "Shadowy figure completes '{title}'", fr: "Une figure mystérieuse termine « {title} »" },
  "mis.newsBody": { en: "Authorities have no comment. The internet has many comments.", fr: "Les autorités n'ont aucun commentaire. Internet en a beaucoup." },
  "mis.targetShort": { en: "target", fr: "cible" },
  "mis.payoutShort": { en: "payout", fr: "paiement" },
  "hack.breach": { en: "Mysterious breach at {target}", fr: "Brèche mystérieuse chez {target}" },
  "hack.breachBody": { en: "Authorities say the attackers left a note: 'you should have patched this in 2012.'", fr: "Les autorités disent que les attaquants ont laissé un mot : « vous auriez dû corriger ça en 2012. »" },
  "hack.logHacked": { en: "Hacked {target}.", fr: "A piraté {target}." },
  "hack.fraglog": { en: "Found a dossier fragment on {npc}.", fr: "Fragment de dossier trouvé sur {npc}." },
  "hack.recon": { en: "Recon complete. {t} is running {os} on {ports}.", fr: "Recon terminée. {t} tourne sous {os} sur {ports}." },
  "hack.pickVector": { en: "Pick an approach:  {v}", fr: "Choisissez une approche :  {v}" },
  "hack.bruteLine": { en: "brute <target> — fast & loud (risky)", fr: "brute <cible> — rapide et bruyant (risqué)" },
  "hack.exploitLine": { en: "exploit <target> — surgical & quiet (needs the right exploit)", fr: "exploit <cible> — chirurgical et discret (nécessite le bon exploit)" },
  "hack.socialLine": { en: "social <target> — charm your way in (needs a dossier on someone there)", fr: "social <cible> — rentrer par le charme (nécessite un dossier sur quelqu'un là-bas)" },
  "hack.noExploit": { en: "You don't have the right exploit for this one. 'tor' sells programs — or go in loud.", fr: "Vous n'avez pas le bon exploit pour celle-ci. « tor » vend des programmes — ou entrez bruyamment." },
  "hack.noSocial": { en: "You need a sold dossier on someone at {t} to social-engineer your way in.", fr: "Il vous faut un dossier vendu sur quelqu'un chez {t} pour entrer par le social." },
  "hack.alreadyPending": { en: "You're mid-hack on {t}. Pick an approach: {v}", fr: "Vous êtes en plein hack de {t}. Choisissez une approche : {v}" },
  "hack.blocked": { en: "{t} noticed the attempt and locked you out for a few hours. Heat everywhere. Try again later.", fr: "{t} a remarqué la tentative et vous a bloqué pour quelques heures. Chaleur partout. Réessayez plus tard." },
  "hack.fail": { en: "Trace detected! The hack failed — you barely got out. Heat is up and {t} is locked for a few hours.", fr: "Trace détectée ! Le hack a échoué — vous êtes sorti de justesse. La chaleur monte et {t} est verrouillé pour quelques heures." },
  "hack.eventFirewall": { en: "A firewall just tripped mid-hack…", fr: "Un pare-feu vient de se déclencher en plein hack…" },
  "hack.eventAdmin": { en: "An admin just connected to the server you're in…", fr: "Un admin vient de se connecter au serveur où vous êtes…" },
  "hack.eventHoneypot": { en: "Wait — this directory is a honeypot…", fr: "Attendez — ce répertoire est un honeypot…" },
  "hack.eventEasy": { en: "Almost too easy. The target is patched with 'if it works, don't touch it' vibes.", fr: "Presque trop facile. La cible est patchée avec la philosophie « si ça marche, n'y touche pas »." },
  "hack.eventClean": { en: "Smooth. You're in, and the logs already say 'system update'.", fr: "Fluide. Vous êtes dedans, et les logs disent déjà « mise à jour système »." },
  "hack.push": { en: "Push through it — {m} extra minutes, +heat risk", fr: "Forcer — {m} minutes en plus, risque de chaleur" },
  "hack.cover": { en: "Cover your tracks — {m} extra minutes, safer", fr: "Couvrir vos traces — {m} minutes en plus, plus sûr" },
  "hack.abort": { en: "Abort — lose the loot, no extra heat", fr: "Abandonner — pas de butin, pas de chaleur en plus" },
  "hack.eventResolved": { en: "You push through. {t} goes down.", fr: "Vous forcez. {t} tombe." },
  "hack.eventCovered": { en: "You cover your tracks just in time. Clean getaway.", fr: "Vous couvrez vos traces à temps. Sortie propre." },
  "hack.eventAborted": { en: "You pull out. Nothing gained, nothing burned.", fr: "Vous vous retirez. Rien gagné, rien brûlé." },
  "hack.vectorChosen": { en: "Vector locked: {v}. Going in…", fr: "Vecteur verrouillé : {v}. Entrée en cours…" },
  "hack.noEvent": { en: "Nothing tripped — you're mid-hack. Pick your vector or wait it out.", fr: "Rien ne s'est déclenché — vous êtes en plein hack. Choisissez un vecteur ou attendez." },

  // skills
  "skills.title": { en: "Skills (rise with use)", fr: "Compétences (montent à l'usage)" },
  "skills.sql": { en: "SQL", fr: "SQL" },
  "skills.social": { en: "Social", fr: "Social" },
  "skills.zero": { en: "0-day", fr: "0-day" },
  "skills.level": { en: "   {name} Lv.{n} {bars}", fr: "   {name} Niv.{n} {bars}" },
  "skills.up": { en: "⬆  {skill} skill up! Lv.{n} — {label} hacks get faster and quieter.", fr: "⬆  Compétence {skill} augmentée ! Niv.{n} — les hacks {label} sont plus rapides et plus discrets." },
  "skills.none": { en: "   No exploits yet. Buy software at the shop to unlock skill tracks.", fr: "   Aucun exploit pour l'instant. Achetez des logiciels à la boutique pour débloquer des compétences." },

  // factions
  "faction.title": { en: "Faction reputation", fr: "Réputation de faction" },
  "faction.none": { en: "   No faction yet. Somewhere around rep 20, someone will come knocking.", fr: "   Aucune faction pour l'instant. Vers la réputation 20, quelqu'un viendra frapper." },
  "faction.line": { en: "   {name}: {n}", fr: "   {name} : {n}" },
  "faction.gain": { en: "+{n} {branch} reputation — your faction appreciates your work.", fr: "+{n} de réputation {branch} — votre faction apprécie votre travail." },
  "faction.discount": { en: "Perk: your faction's loyalty gets you 10% off at Jerry's shop.", fr: "Perk : la loyauté de votre faction vous vaut 10% de réduction chez Jerry." },
  "faction.heatProt": { en: "Perk: your faction's protection cools your heat faster each day.", fr: "Perk : la protection de votre faction refroidit votre chaleur plus vite chaque jour." },
  "faction.exclusive": { en: "Perk: exclusive {branch} missions now appear on your board.", fr: "Perk : des missions exclusives {branch} apparaissent maintenant sur votre tableau." },

  // random events
  "event.bill": { en: "⚡ Electricity bill: -{m}. The city knows what you're running in that bedroom.", fr: "⚡ Facture d'électricité : -{m}. La ville sait ce que vous faites tourner dans cette chambre." },
  "event.billLog": { en: "Paid the electricity bill.", fr: "A payé la facture d'électricité." },
  "event.billNews": { en: "Local man's power bill 'mysteriously high'", fr: "La facture d'électricité d'un local « mystérieusement élevée »" },
  "event.billNewsB": { en: "Utility company cites 'excessive compute'. The compute in question remains classified.", fr: "Le fournisseur évoque « une puissance de calcul excessive ». La puissance en question reste classifiée." },
  "event.landlord": { en: "🔑 Mrs. Chen 'passes by to check the pipes' for 40 minutes. You hide behind the curtain. She leaves a rent reminder: -{m}.", fr: "🔑 Mme Chen « passe vérifier les tuyaux » pendant 40 minutes. Vous vous cachez derrière le rideau. Elle laisse un rappel de loyer : -{m}." },
  "event.landlordLog": { en: "Paid a surprise rent reminder to Mrs. Chen.", fr: "A payé un rappel de loyer surprise à Mme Chen." },
  "event.cop": { en: "🚔 A patrol car slows down in front of your building. They're 'just checking the neighborhood'. Your heart rate says otherwise. heat +{h}.", fr: "🚔 Une voiture de patrouille ralentit devant votre immeuble. Ils « vérifient juste le quartier ». Votre rythme cardiaque dit le contraire. chaleur +{h}." },
  "event.copLog": { en: "A patrol car cruised by. Nerves were shot.", fr: "Une voiture de patrouille est passée. Nerfs en miettes." },
  "event.neighbor": { en: "👋 Your neighbor knocks: his Wi-Fi 'broke again'. You fix it in 3 minutes for {m}. He leaves relieved. Your heat cools a little.", fr: "👋 Votre voisin frappe : son Wi-Fi « encore en panne ». Vous le réparez en 3 minutes pour {m}. Il repart soulagé. Votre chaleur retombe un peu." },
  "event.neighborLog": { en: "Fixed the neighbor's Wi-Fi for pocket change.", fr: "A réparé le Wi-Fi du voisin pour quelques pièces." },
  "event.chance": { en: "📦 A day in the life…", fr: "📦 Une journée dans la vie…" },

  // career
  "career.title": { en: "CAREER RECORD — Dave's legend so far", fr: "PALMARÈS — La légende de Dave jusqu'ici" },
  "career.hours": { en: "   Time since firing: {h}h ({d} days)", fr: "   Temps depuis le licenciement : {h}h ({d} jours)" },
  "career.hacks": { en: "   Hacks completed: {n}", fr: "   Hacks terminés : {n}" },
  "career.moneyEarned": { en: "   Total money earned: {m}", fr: "   Argent gagné au total : {m}" },
  "career.bestDay": { en: "   Best day: +{m} (Day {d})", fr: "   Meilleure journée : +{m} (jour {d})" },
  "career.favTarget": { en: "   Favorite target: {t}", fr: "   Cible favorite : {t}" },
  "career.none": { en: "   Nothing yet. The legend is being written in real time (in-game time).", fr: "   Rien pour l'instant. La légende s'écrit en direct (temps de jeu)." },
  "career.missions": { en: "   Missions completed: {n}", fr: "   Missions terminées : {n}" },
  "career.twists": { en: "   'MAIS NON!' moments: {n}", fr: "   Moments « MAIS NON ! » : {n}" },
  "career.level": { en: "   Level: {l}", fr: "   Niveau : {l}" },

  // xp & achievements
  "xp.gain": { en: "+{n} XP", fr: "+{n} XP" },
  "xp.levelup": { en: "⬆ LEVEL UP! Lv.{n}", fr: "⬆ NIVEAU SUPÉRIEUR ! Niv.{n}" },
  "xp.bonus": { en: "Lv.{n} perk: +{b} cash · hacks faster · quieter ops · better mining", fr: "Perk Niv.{n} : +{b} en cash · hacks plus rapides · ops plus discrètes · meilleur minage" },
  "ach.title": { en: "ACHIEVEMENTS — your legend, in trophies", fr: "SUCCÈS — votre légende, en trophées" },
  "ach.level": { en: "   Level {l} · {xp} XP ({into} / {next} to next)", fr: "   Niveau {l} · {xp} XP ({into} / {next} avant le suivant)" },
  "ach.count": { en: "   {got}/{total} trophies unlocked", fr: "   {got}/{total} trophées débloqués" },
  "ach.unlock": { en: "🏆 ACHIEVEMENT UNLOCKED: {title}", fr: "🏆 SUCCÈS DÉBLOQUÉ : {title}" },

  // arcs
  "arcs.title": { en: "ARCS — optional side stories", fr: "ARCS — histoires parallèles facultatives" },
  "arcs.none": { en: "   No arcs discovered yet. The world keeps its secrets. Keep playing.", fr: "   Aucun arc découvert pour l'instant. Le monde garde ses secrets. Continuez à jouer." },
  "arcs.active": { en: "ACTIVE", fr: "ACTIF" },
  "arcs.done": { en: "DONE", fr: "TERMINÉ" },
  "arcs.hint": { en: "Arcs are optional. Skip them, finish them — the world doesn't care. The money cares.", fr: "Les arcs sont facultatifs. Sautez-les, terminez-les — le monde s'en fiche. L'argent, lui, s'en soucie." },
  "arcs.investMin": { en: "Minimum investment: $10. Gertie frowns at smaller sums.", fr: "Investissement minimum : 10 $. Gertie fronce les sourcils pour moins." },
  "arcs.notActive": { en: "That arc isn't accepting investments right now.", fr: "Cet arc n'accepte pas d'investissements pour l'instant." },
  "arcs.invested": { en: "📈 Invested {m} in the Gertie Fonds. Total: {t}. The pyramid grows.", fr: "📈 {m} investis dans le Fonds Gertie. Total : {t}. La pyramide grandit." },
  "arcs.finale": { en: "── ARC COMPLETE: {title} ──", fr: "── ARC TERMINÉ : {title} ──" },
  "arcs.rewardMoney": { en: "💸 +{m}", fr: "💸 +{m}" },
  "arcs.rewardRep": { en: "rep +{r}", fr: "réputation +{r}" },
  "arcs.rewardStyle": { en: "style +{s}", fr: "style +{s}" },
  "help.story": { en: "Story", fr: "Histoire" },

  // tutorial (scripted Noro-chan guidance)
  "tut.scan": { en: "First things first, Dave~ type 'scan' to see what's out there. I'll wait. Not patiently, but I'll wait.", fr: "Première étape, Dave~ tape « scan » pour voir ce qui traîne dehors. J'attends. Pas patiemment, mais j'attends." },
  "tut.hack": { en: "See a target you like? Try 'hack <target>'~ It runs in the background. Meanwhile, type 'help' to learn the ropes. Or don't. Chaos is fine too.", fr: "Une cible qui te plaît ? Essaie « hack <cible> »~ Ça tourne en arrière-plan. Pendant ce temps, tape « help » pour apprendre les ficelles. Ou pas. Le chaos va aussi." },
  "tut.missions": { en: "Good~ now the real money: type 'missions' and accept one. Then hack its target and 'missions deliver <id>' when done. Easy money, Dave~ (allegedly).", fr: "Bien~ maintenant le vrai argent : tape « missions » et acceptes-en une. Puis hack sa cible et « missions deliver <id> » quand c'est fait. Argent facile, Dave~ (soi-disant)." },
  "tut.deliver": { en: "You're doing great, Dave~ just deliver the mission on time. Deadlines are like my patience: real, but flexible. Mostly real.", fr: "Tu gères, Dave~ livre juste la mission à temps. Les échéances, c'est comme ma patience : réelles, mais flexibles. Surtout réelles." },
  "tut.done": { en: "And that's the game, Dave~ scan, hack, deliver, upgrade, repeat. Try the shop next: 'shop' or the Shop tab. You're basically employed now. In crime.", fr: "Et voilà le jeu, Dave~ scan, hack, livre, améliore, recommence. Essaie la boutique ensuite : « shop » ou l'onglet Boutique. T'es quasi employé, là. Dans le crime." },

  // power / ambiance
  "power.off": { en: "Shutting down Frank…\nFrank lets out a sad little beep.\nGoodnight, Dave.", fr: "Extinction de Frank…\nFrank émet un petit bip triste.\nBonne nuit, Dave." },
  "power.on": { en: "Booting Frank (2008 HP Pavilion)…\nBIOS: Frank Industries — version 6.66\nFrank is awake. He has seen things. He is ready to see more.", fr: "Démarrage de Frank (HP Pavilion 2008)…\nBIOS : Frank Industries — version 6.66\nFrank est réveillé. Il a vu des choses. Il est prêt à en voir plus." },
  "power.blocked": { en: "Frank is powered off. The screen is dark. A faint 'reboot' is the only way back.", fr: "Frank est éteint. L'écran est noir. Un « reboot » est le seul chemin du retour." },
  "power.hint": { en: "Type 'poweroff' to turn Frank off, 'reboot' to wake him, 'screensaver' for vibes.", fr: "Tapez 'poweroff' pour éteindre Frank, 'reboot' pour le réveiller, 'screensaver' pour l'ambiance." },
  "saver.msg": { en: "The floating logo drifts across the screen. Frank is daydreaming about the 2008 MacBook he could have been.", fr: "Le logo flottant dérive sur l'écran. Frank rêvasse au MacBook de 2008 qu'il aurait pu être." },

  // save slots
  "slots.title": { en: "SAVE SLOTS", fr: "EMPLACEMENTS DE SAUVEGARDE" },
  "slots.usage": { en: "→ slot <1|2|3> to switch", fr: "→ slot <1|2|3> pour changer" },
  "slots.empty": { en: "empty — starts fresh", fr: "vide — commencera à zéro" },
  "slots.current": { en: " (current)", fr: " (actuel)" },
  "slots.switched": { en: "Switched to slot {n}. Welcome to your other life, Dave.", fr: "Passage à l'emplacement {n}. Bienvenue dans votre autre vie, Dave." },
  "slot.invalid": { en: "Usage: slot <1|2|3>", fr: "Usage : slot <1|2|3>" },

  // tutorial (relaunchable guide)
  "tutorial.title": { en: "TUTORIAL — how to be a (fake) hacker", fr: "TUTORIEL — comment être un (faux) hacker" },
  "tutorial.intro": { en: "You're an ex-devops who knows systems — the crime part is new. This guide walks you through it. Re-open it any time.", fr: "Vous êtes un ex-devops qui connaît les systèmes — la partie crime est nouvelle. Ce guide vous accompagne. Rouvrez-le quand vous voulez." },
  "tutorial.open": { en: "→ tutorial {n} to read the first chapter (or tutorial <number> for any chapter)", fr: "→ tutorial {n} pour lire le premier chapitre (ou tutorial <numéro> pour un chapitre précis)" },
  "tutorial.skippable": { en: "Everything here is optional. The terminal doesn't judge. (Noro-chan does, but she'd do that anyway.)", fr: "Tout ici est facultatif. Le terminal ne juge pas. (Noro-chan si, mais elle le ferait de toute façon.)" },
  "tutorial.next": { en: "→ tutorial {n} for the next chapter · tutorial for the contents", fr: "→ tutorial {n} pour le chapitre suivant · tutorial pour le sommaire" },
  "tutorial.noChapter": { en: "No chapter '{n}'. Chapters run 1–{max}. Try 'tutorial'. ", fr: "Pas de chapitre « {n} ». Les chapitres vont de 1 à {max}. Essayez 'tutorial'." },

  // proactive contextual hints
  "hint.gpu": { en: "Psst Dave~ you're mining with a potato. Buy a GPU at the shop. 'shop', then 'buy gpu1'. Or keep being pathetic, it's a look.", fr: "Psst Dave~ tu mines avec une patate. Achète un GPU à la boutique. « shop », puis « buy gpu1 ». Ou continue d'être pathétique, ça te va bien." },
  "hint.broke": { en: "Broke AND bored, Dave~? A legendary combo. Type 'scan' and hack the easiest thing. Cash, chaos, and my endless commentary.", fr: "Fauché ET ennuyé, Dave~? Un combo légendaire. Tape « scan » et hacke le truc le plus facile. Du cash, du chaos, et mes commentaires sans fin." },
  "hint.ram": { en: "One hack at a time must feel so… 2010. 'shop' → buy some RAM for parallel hacks. Your future crimes will thank you.", fr: "Un hack à la fois, ça doit faire tellement… 2010. « shop » → achète de la RAM pour des hacks en parallèle. Tes futurs crimes te remercieront." },
  "hint.heat": { en: "Umm~ your heat is climbing. A VPN would help: 'buy vpn1'. Or keep cooking. I like you crispy.", fr: "Euh~ ta chaleur grimpe. Un VPN aiderait : « buy vpn1 ». Ou continue de cuire. Je t'aime bien croustillant." },
  "hint.vps": { en: "You've got money burning a hole in your pocket, Dave~ a VPS means parallel hacks AND less heat. Just saying. 'shop'.", fr: "L'argent te brûle les poches, Dave~ un VPS = hacks en parallèle ET moins de chaleur. Je dis ça, je dis rien. « shop »." },
  "hint.idle": { en: "*soft typing sounds* …what? I'm not watching you, Dave~ I just have nothing better to do. Same as you, apparently.", fr: "*bruits de clavier doux* …quoi ? Je te regarde pas, Dave~ j'ai juste rien de mieux à faire. Comme toi, apparemment." },
};

// ── Per-command help/detail (translated; falls back to the English field) ──

export const CMD_HELP: Record<string, Bilingual> = {
  help: { en: "Show this help, or details about a specific command.", fr: "Affiche l'aide, ou les détails d'une commande." },
  tutorial: { en: "Relaunch the tutorial — the whole guide, or one chapter.", fr: "Relancez le tutoriel — le guide complet, ou un chapitre." },
  stats: { en: "Show your full player sheet.", fr: "Affiche votre fiche complète de joueur." },
  scan: { en: "Scan nearby networks. Optionally inspect one.", fr: "Scanne les réseaux à proximité. Inspectez-en un en option." },
  hack: { en: "Start a brute-force hack on a target from the scan list.", fr: "Lance un hack par force brute sur une cible de la liste scan." },
  missions: { en: "View, accept, and deliver missions.", fr: "Consultez, acceptez et livrez des missions." },
  buy: { en: "Buy hardware or software from the shop.", fr: "Achetez du matériel ou des logiciels à la boutique." },
  shop: { en: "Browse the shop — hardware, software, lifestyle items.", fr: "Parcourez la boutique — matériel, logiciels, objets de style de vie." },
  inv: { en: "Show your current gear and exploits.", fr: "Affiche votre équipement et vos exploits." },
  sell: { en: "Sell a completed dossier to The Daily Leak.", fr: "Vendez un dossier complet à The Daily Leak." },
  people: { en: "List people you have intel on.", fr: "Liste les personnes sur lesquelles vous avez des informations." },
  news: { en: "Read the latest headlines.", fr: "Lisez les dernières actualités." },
  search: { en: "Search your logs, news, and dossiers. Matches are highlighted.", fr: "Cherche dans vos journaux, actualités et dossiers. Correspondances surlignées." },
  miner: { en: "Control your crypto mining rig.", fr: "Contrôlez votre ferme de minage de crypto." },
  coin: { en: "Speculate on PUPPYCOIN. Definitely not a scam.", fr: "Spéculez sur PUPPYCOIN. Sûrement pas une arnaque." },
  settings: { en: "View or change game settings.", fr: "Affiche ou modifie les paramètres du jeu." },
  save: { en: "Save the game.", fr: "Sauvegarde la partie." },
  reset: { en: "Wipe your save and start over.", fr: "Efface votre sauvegarde et recommence." },
  whoami: { en: "Reveal your true identity.", fr: "Révèle votre véritable identité." },
  clear: { en: "Clear the terminal.", fr: "Efface le terminal." },
  credits: { en: "Who made this?", fr: "Qui a fait ça ?" },
  about: { en: "About this game.", fr: "À propos de ce jeu." },
  tor: { en: "Browse the fake darknet: hidden services, programs, and scams.", fr: "Parcourez le darknet : services cachés, programmes et arnaques." },
  choose: { en: "Make a branching story choice when factions come calling.", fr: "Prenez une décision narrative quand les factions vous contactent." },
  career: { en: "Show your career record: hacks, earnings, favorite target.", fr: "Affiche votre palmarès : hacks, gains, cible favorite." },
  achievements: { en: "Show your achievements (trophies) and XP.", fr: "Affiche vos succès (trophées) et votre XP." },
  arcs: { en: "Optional side storylines with big, optional payoffs.", fr: "Histoires parallèles facultatives avec de gros gains facultatifs." },
  slots: { en: "List your 3 save slots.", fr: "Liste vos 3 emplacements de sauvegarde." },
  slot: { en: "Switch save slot (1, 2 or 3).", fr: "Change d'emplacement de sauvegarde (1, 2 ou 3)." },
  poweroff: { en: "Turn Frank off. He'll be sad.", fr: "Éteint Frank. Il sera triste." },
  reboot: { en: "Boot Frank back up.", fr: "Redémarre Frank." },
  screensaver: { en: "Summon the floating logo. Vibes.", fr: "Invoque le logo flottant. Ambiance." },
};

export const CMD_DETAIL: Record<string, Bilingual> = {
  help: { en: "Lists all commands grouped by category. Use `help <command>` for details on one command.", fr: "Liste toutes les commandes par catégorie. Utilisez `help <commande>` pour les détails d'une commande." },
  tutorial: { en: "A structured guide you can re-open any time. `tutorial` shows the table of contents; `tutorial <n>` shows one chapter.", fr: "Un guide structuré que vous pouvez rouvrir à tout moment. `tutorial` affiche le sommaire ; `tutorial <n>` affiche un chapitre." },
  stats: { en: "Displays money, reputation, heat, style, your laptop's hardware, and derived stats.", fr: "Affiche l'argent, la réputation, la chaleur, le style, le matériel de votre ordinateur et les stats dérivées." },
  scan: { en: "Lists all hackable networks in range with difficulty ratings. `scan <name>` shows details for one target.", fr: "Liste tous les réseaux piratables à portée avec leur difficulté. `scan <nom>` montre les détails d'une cible." },
  hack: { en: "Starts a background hack job. It takes time (based on your CPU). You can do other things while it runs. Your RAM limits how many hacks run in parallel.", fr: "Lance un hack en arrière-plan. Il prend du temps (selon votre CPU). Vous pouvez faire autre chose pendant ce temps. Votre RAM limite le nombre de hacks en parallèle." },
  missions: { en: "Missions pay well and build reputation. Accept one, hack its target, then `missions deliver <id>` to collect.", fr: "Les missions paient bien et font grimper la réputation. Acceptez-en une, piratez sa cible, puis `missions deliver <id>` pour encaisser." },
  buy: { en: "Run 'inv' to see your current gear. Run 'buy' with no args to list the shop. Tier items replace your current tier — buy the next one up.", fr: "Faites 'inv' pour voir votre équipement. 'buy' sans argument liste la boutique. Les objets par palier remplacent le palier actuel — achetez le suivant." },
  shop: { en: "Lists everything Jerry sells, grouped by category. Buy with 'buy <id>'. The Shop panel shows the same catalog with one-click buttons.", fr: "Liste tout ce que Jerry vend, groupé par catégorie. Achetez avec 'buy <id>'. Le panneau Boutique affiche le même catalogue avec des boutons en un clic." },
  inv: { en: "Lists installed hardware, software exploits, and lifestyle items.", fr: "Liste le matériel installé, les exploits logiciels et les objets de style de vie." },
  sell: { en: "Requires 3/3 dossier fragments. The price depends on how juicy the person is.", fr: "Nécessite 3/3 fragments de dossier. Le prix dépend de la jutosité de la personne." },
  people: { en: "Shows discovered contacts and their dossier progress. Hack their employer or read the news to collect fragments (3/3 to sell).", fr: "Affiche les contacts découverts et leur progression de dossier. Piratez leur employeur ou lisez les infos pour récolter des fragments (3/3 pour vendre)." },
  news: { en: "The world keeps spinning (and leaking). Read the news — it's also a way to pick up intel on people.", fr: "Le monde continue de tourner (et de fuiter). Lisez les infos — c'est aussi un moyen de récupérer des renseignements sur les gens." },
  search: { en: "Runs a full-text search over your event log, the news archive, and dossier fragments. Run 'search' alone to browse your recent log.", fr: "Effectue une recherche plein texte dans votre journal d'événements, les archives d'infos et les fragments de dossier. 'search' seul affiche votre journal récent." },
  miner: { en: "Your rig mines in the background whenever time passes. Better GPU = more per hour. 'miner stop' halts it (why would you).", fr: "Votre ferme mine en arrière-plan à chaque fois que le temps passe. Meilleur GPU = plus par heure. 'miner stop' l'arrête (pourquoi faire ?)." },
  coin: { en: "PUPPYCOIN's price drifts every few in-game hours. Buy low, sell high, lose everything. The classic.", fr: "Le prix de PUPPYCOIN varie toutes les quelques heures de jeu. Achetez bas, vendez haut, perdez tout. Le grand classique." },
  settings: { en: "Keys: theme, fontsize, anim, sound, lang (en|fr), ainame, aiurl, aiprompt. `settings ai` shows the AI sidekick's editable persona prompt.", fr: "Clés : theme, fontsize, anim, sound, lang (en|fr), ainame, aiurl, aiprompt. `settings ai` affiche le prompt modifiable de votre IA." },
  save: { en: "Your progress is saved to SQLite after every command anyway. This command exists so you feel in control.", fr: "Votre progression est sauvegardée dans SQLite après chaque commande de toute façon. Cette commande existe pour que vous vous sentiez maître à bord." },
  reset: { en: "Deletes everything. Dave forgets everything. Frank remembers everything. Frank will never forget.", fr: "Tout efface. Dave oublie tout. Frank se souvient de tout. Frank n'oubliera jamais." },
  whoami: { en: "A deep philosophical investigation into the nature of the self.", fr: "Une profonde enquête philosophique sur la nature du soi." },
  clear: { en: "Wipes the visible terminal. Your crimes remain on the database, as they should.", fr: "Efface le terminal visible. Vos crimes restent dans la base de données, comme il se doit." },
  credits: { en: "A brief and humble acknowledgment.", fr: "Un remerciement bref et humble." },
  about: { en: "The story so far: you were fired. That's it. That's the whole setup.", fr: "L'histoire jusqu'ici : vous avez été viré. Voilà. C'est toute la mise en place." },
  tor: { en: "Connect to hidden services. 'tor visit <site>' to open one, 'tor install <id>' to buy a program at the Bazaar. Programs give real effects.", fr: "Connectez-vous aux services cachés. 'tor visit <site>' pour en ouvrir un, 'tor install <id>' pour acheter un programme au Bazar. Les programmes ont de vrais effets." },
  choose: { en: "When your reputation peaks, three factions will make you an offer. Choosing shapes which missions you get later.", fr: "Quand votre réputation monte, trois factions vous feront une offre. Le choix oriente les missions que vous recevrez ensuite." },
  career: { en: "Tracks hours played, hacks done, money earned, your best day, and your favorite target. The legend of Dave, in numbers.", fr: "Comptabilise les heures jouées, les hacks, l'argent gagné, votre meilleure journée et votre cible favorite. La légende de Dave, en chiffres." },
  slots: { en: "Three save slots, three lives. Each has its own SQLite file — switching is instant and safe.", fr: "Trois emplacements, trois vies. Chacun a son propre fichier SQLite — le changement est instantané et sans risque." },
  slot: { en: "Switches the active save slot. Your current slot is saved automatically before the switch.", fr: "Change l'emplacement actif. Votre emplacement actuel est sauvegardé automatiquement avant le changement." },
  poweroff: { en: "Frank shuts down. While off, every command is refused except 'reboot'. He deserves the rest.", fr: "Frank s'éteint. Éteint, toutes les commandes sont refusées sauf « reboot ». Il mérite ce repos." },
  reboot: { en: "Wakes Frank up with the full boot sequence. He missed you (he didn't).", fr: "Réveille Frank avec la séquence de démarrage complète. Tu lui as manqué (non)." },
  screensaver: { en: "The EVILHACK logo floats across the screen. Frank's screensaver is the only thing that dreams.", fr: "Le logo EVILHACK flotte sur l'écran. L'économiseur de Frank est la seule chose qui rêve." },
  achievements: { en: "Every action gives XP. Level up for passive bonuses — faster hacks, quieter ops, better mining. Complete hidden criteria to unlock trophies.", fr: "Chaque action donne de l'XP. Montez de niveau pour des bonus passifs — hacks plus rapides, ops plus discrètes, meilleur minage. Remplissez des critères cachés pour débloquer des trophées." },
  arcs: { en: "Each arc is a chain of steps checked as you play — hack targets, sell dossiers, invest cash. Finish one for a big payout and a permanent perk. Skip them, and the world moves on without you.", fr: "Chaque arc est une chaîne d'étapes vérifiées au fil du jeu — hacker des cibles, vendre des dossiers, investir du cash. Terminez-en un pour un gros paiement et un perk permanent. Sautez-les, et le monde avance sans vous." },
};

export function cmdHelp(lang: Lang, name: string, fallback: string): string {
  return pick(lang, CMD_HELP[name]) || fallback;
}

export function cmdDetail(lang: Lang, name: string, fallback: string): string {
  return pick(lang, CMD_DETAIL[name]) || fallback;
}
