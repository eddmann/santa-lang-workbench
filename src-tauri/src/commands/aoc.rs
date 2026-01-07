use crate::state::AppState;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AocPuzzle {
    pub year: u32,
    pub day: u32,
    pub title: String,
    pub description_html: String,
    pub input: Option<String>,
}

/// Extract the puzzle title from the h2 element
fn extract_title(html: &str) -> String {
    let document = Html::parse_document(html);
    let selector = Selector::parse("h2").unwrap();

    if let Some(h2) = document.select(&selector).next() {
        let text = h2.text().collect::<String>();
        // Title format is usually "--- Day X: Title ---"
        text.trim_matches(|c| c == '-' || c == ' ').to_string()
    } else {
        "Advent of Code Puzzle".to_string()
    }
}

/// Extract and clean the description HTML from article.day-desc elements
fn extract_description(html: &str) -> String {
    let document = Html::parse_document(html);
    let article_selector = Selector::parse("article.day-desc").unwrap();

    let mut parts: Vec<String> = Vec::new();

    for article in document.select(&article_selector) {
        // Get the inner HTML and do some cleanup
        let inner = article.inner_html();

        // Fix relative links to be absolute
        let fixed = inner
            .replace("href=\"/", "href=\"https://adventofcode.com/")
            .replace("href='/", "href='https://adventofcode.com/");

        parts.push(fixed);
    }

    parts.join("\n<hr/>\n")
}

#[tauri::command]
pub async fn fetch_aoc_puzzle(
    state: State<'_, Mutex<AppState>>,
    year: u32,
    day: u32,
) -> Result<AocPuzzle, String> {
    let aoc_token = {
        let state = state.lock().map_err(|e| e.to_string())?;
        state.settings.aoc_session_token.clone()
    };

    let client = reqwest::Client::new();

    // Fetch the puzzle page (public, no auth needed for description)
    let puzzle_url = format!("https://adventofcode.com/{}/day/{}", year, day);
    let puzzle_response = client
        .get(&puzzle_url)
        .header("User-Agent", "santa-lang-workbench/1.0")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch puzzle page: {}", e))?;

    if !puzzle_response.status().is_success() {
        return Err(format!(
            "Failed to fetch puzzle: HTTP {}",
            puzzle_response.status()
        ));
    }

    let puzzle_html = puzzle_response
        .text()
        .await
        .map_err(|e| format!("Failed to read puzzle response: {}", e))?;

    // Extract title and description synchronously (not across await)
    let title = extract_title(&puzzle_html);
    let description_html = extract_description(&puzzle_html);

    // Fetch input if we have a session token
    let input = if let Some(token) = aoc_token {
        if !token.trim().is_empty() {
            let input_url = format!("https://adventofcode.com/{}/day/{}/input", year, day);
            let input_response = client
                .get(&input_url)
                .header("User-Agent", "santa-lang-workbench/1.0")
                .header("Cookie", format!("session={}", token))
                .send()
                .await
                .map_err(|e| format!("Failed to fetch input: {}", e))?;

            if input_response.status().is_success() {
                Some(
                    input_response
                        .text()
                        .await
                        .map_err(|e| format!("Failed to read input: {}", e))?
                        .trim_end()
                        .to_string(),
                )
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    Ok(AocPuzzle {
        year,
        day,
        title,
        description_html,
        input,
    })
}
