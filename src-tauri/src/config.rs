pub const IMPLEMENTATIONS: &[(&str, &str, &str)] = &[
    ("comet", "Comet", "eddmann/santa-lang-comet"),
    ("blitzen", "Blitzen", "eddmann/santa-lang-blitzen"),
    ("dasher", "Dasher", "eddmann/santa-lang-dasher"),
    ("donner", "Donner", "eddmann/santa-lang-donner"),
    ("prancer", "Prancer", "eddmann/santa-lang-prancer"),
    ("vixen", "Vixen", "eddmann/santa-lang-vixen"),
];

pub fn get_repo_for_codename(codename: &str) -> Option<&'static str> {
    IMPLEMENTATIONS
        .iter()
        .find(|(c, _, _)| *c == codename)
        .map(|(_, _, repo)| *repo)
}

pub fn get_name_for_codename(codename: &str) -> Option<&'static str> {
    IMPLEMENTATIONS
        .iter()
        .find(|(c, _, _)| *c == codename)
        .map(|(_, name, _)| *name)
}
