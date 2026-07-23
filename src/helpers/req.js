function fetchJSON(url, body) {
    return fetch(url,body).then(async r => {
        if (!r.ok) throw new Error(`Invalid Status Code: ${r.status} (${r.statusText})\n${await r.text().catch(e => `Error on body: ${e}`)}`);
        return r.json();
    });
}

export {
    fetchJSON,
}
