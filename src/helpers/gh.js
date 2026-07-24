import { fetchJSON } from "./req.js"

function doOpts(opts) {
    opts = opts || {};
    let headers = opts.headers = opts.headers || {}
    opts.headers = headers
    headers["Accept"] = headers["Accept"] || "application/vnd.github+json";
    headers["User-Agent"] = headers["User-Agent"] || "HotPot Bot";
    headers["Authorization"] = headers["Authorization"] || `bearer ${process.env.GH_PAT}`;
    headers["X-GitHub-Api-Version"] = headers["X-GitHub-Api-Version"] || `2026-03-10`;
    return opts

}

function fetchGH(path, opts) {
    return fetchJSON(new URL(path, "https://api.github.com").href, doOpts(opts));
}

async function checkOrg(username) {
    const r = await fetch(`https://api.github.com/orgs/${process.env.GH_ORG_NAME}/memberships/${username}`, doOpts())
    if (![200,404].includes(r.status)) {
        throw new Error('Unexpected status code ' + r.status + ' ' + await r.text())
    }
    if (r.status === 404) return false;
    const data = await r.json()
    return data.state;
}

function inviteUser(id) {
    return fetchGH(`/orgs/${process.env.GH_ORG_NAME}/invitations`, {
        method: "POST",
        body: JSON.stringify({invitee_id: id}),
    });
}

function addUserToTeam(username, team) {
    return fetchGH(`/orgs/${process.env.GH_ORG_NAME}/teams/${team}/memberships/${username}`, {
        method: "PUT",
    });
}

export {
    fetchGH,
    checkOrg,
    inviteUser,
    addUserToTeam,
}
