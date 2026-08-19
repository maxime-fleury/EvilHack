import type { Line } from "./output";
import { ascii, blank, dim, divider, info, title } from "./output";
import type { Lang } from "./i18n";
import { pick } from "./i18n";

/** The login screen — shown before the player identifies (no password, just a name). */
export function loginLines(lang: Lang): Line[] {
  return [
    title(pick(lang, { en: "FRANK OS v0.1 — Personal Computer", fr: "FRANK OS v0.1 — Ordinateur Personnel" })),
    dim(pick(lang, { en: "(c) 2008 Frank Industries. All rights reserved. And lefts. Mostly lefts.", fr: "(c) 2008 Frank Industries. Tous droits réservés. Et gauches. Surtout gauches." })),
    blank,
    dim(pick(lang, { en: "No password on this machine. Frank doesn't believe in them.", fr: "Pas de mot de passe sur cette machine. Frank n'y croit pas." })),
    info(pick(lang, { en: "Identify yourself, stranger:", fr: "Identifiez-vous, étranger :" })),
    blank,
  ];
}

// The startup banner (String.raw so the \ in the art isn't treated as escapes).
const LOGO = String.raw`   ___ __ __  ____  _          __ __   ____    __  __  _ 
  /  _]  |  ||    || |        |  |  | /    |  /  ]|  |/ ]
 /  [_|  |  | |  | | |        |  |  ||  o  | /  / |  ' / 
|    _]  |  | |  | | |___     |  _  ||     |/  /  |    \ 
|   [_|  :  | |  | |     |    |  |  ||  _  /   \_ |     |
|     |\   /  |  | |     |    |  |  ||  |  \     ||  .  |
|_____| \_/  |____||_____|    |__|__||__|__|\____||__|\_|
`.split("\n").filter((l) => l.trim() !== "");

export function introLines(lang: Lang = "en", identified = true, name = ""): Line[] {
  if (!identified) return loginLines(lang);
  const you = name || (lang === "fr" ? "Dave" : "Dave");
  return [
    ...LOGO.map((l) => ascii(l)),
    blank,
    divider(pick(lang, { en: "A STORY OF UNEMPLOYMENT", fr: "UNE HISTOIRE DE CHÔMAGE" })),
    title(pick(lang, { en: `Monday. 9:04 AM. You are ${you}.`, fr: `Lundi. 9h04. Vous êtes ${you}.` })),
    dim(pick(lang, { en: "For six years you kept MegaCorp alive: the servers, the pipelines, the 3 AM incidents where everyone else was 'on it' and you were the 'it'. You were the devops guy. The YAML whisperer. The one who explained Kubernetes to managers for the fifth time, calmly, like a saint.", fr: "Pendant six ans, vous avez maintenu MegaCorp en vie : les serveurs, les pipelines, les incidents de 3 h du matin où tout le monde « s'en occupait » et où vous étiez « le » responsable. Vous étiez le gars de la prod. Le chuchoteur de YAML. Celui qui expliquait Kubernetes aux managers pour la cinquième fois, calmement, comme un saint." })),
    dim(pick(lang, { en: "On Friday they fired you for 'excessive dedication to the free snacks'.", fr: "Vendredi, ils vous ont viré pour « dévotion excessive aux snacks gratuits »." })),
    dim(pick(lang, { en: "Your severance package: a cardboard box with a stapler inside, and a laptop named Frank.", fr: "Votre indemnité : un carton avec une agrafeuse à l'intérieur, et un ordinateur portable nommé Frank." })),
    dim(pick(lang, { en: "Frank is a 2008 HP Pavilion. Frank has seen things. Frank has outlived two data centers and a cafeteria microwave.", fr: "Frank est un HP Pavilion de 2008. Frank en a vu. Frank a survécu à deux centres de données et à un micro-ondes de cantine." })),
    dim(pick(lang, { en: "You've never hacked anyone in your life. You've fought firewalls, clusters, and a PM named Karen. You know how systems tick — you've just never broken one on purpose.", fr: "Vous n'avez jamais piraté personne de votre vie. Vous avez combattu des pare-feu, des clusters et une cheffe de projet nommée Karen. Vous savez comment les systèmes fonctionnent — vous ne les avez simplement jamais cassés exprès." })),
    dim(pick(lang, { en: "The box felt heavier than a laptop should. You told yourself it was the stapler.", fr: "Le carton semblait plus lourd qu'un ordinateur ne devrait l'être. Vous vous êtes dit que c'était l'agrafeuse." })),
    dim(pick(lang, { en: "Carol, the HR manager, didn't look you in the eye at the exit interview. She wrote something, crossed it out, wrote it again.", fr: "Carol, la responsable RH, ne vous a pas regardé dans les yeux à l'entretien de sortie. Elle a écrit quelque chose, l'a barré, l'a réécrit." })),
    blank,
    info(pick(lang, { en: "You're bored. You're broke. You have $15 and a grudge.", fr: "Vous vous ennuyez. Vous êtes fauché. Vous avez 15 $ et une rancune." })),
    info(pick(lang, { en: "You know how to fix systems. The question is: how much can you get for breaking them?", fr: "Vous savez réparer les systèmes. La question : combien pouvez-vous gagner en les cassant ?" })),
    info(pick(lang, { en: "There's a darknet out there. People to hack. Money to be made. Reputation to build.", fr: "Il y a un darknet là-bas. Des gens à pirater. De l'argent à gagner. Une réputation à bâtir." })),
    info(pick(lang, { en: "Maybe a mysterious hacker collective called NullSec will notice you. Maybe not.", fr: "Peut-être qu'un mystérieux collectif de hackers nommé NullSec vous remarquera. Peut-être pas." })),
    blank,
    dim(pick(lang, { en: "Type 'help' to see commands. Type 'missions' to find work. Tab autocompletes.", fr: "Tapez 'help' pour voir les commandes. Tapez 'missions' pour trouver du travail. Tab complète automatiquement." })),
    blank,
  ];
}
