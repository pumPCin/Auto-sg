#!/usr/bin/env node
'use strict';
const jsdom = require('jsdom');
const $ = require('jquery')(new jsdom.JSDOM().window);
const fs = require('fs');
const rq = require('axios').default;
const my_ua = loadFile('user-agent');
const my_cookie = loadFile('steam_cookie');
let ownapps = '',
ownsubs = '';
//
// Default settings
//
const update_steam = true;
const update_dlc = true;
const update_dlc_skip = true; // need update_steam = true
const update_card = true;
//
//
if (update_steam) {
updateSteam();
}
if (update_dlc) {
updateDlc();
}
if (update_card) {
updateCard();
}
function updateSteam() {
let own = 'err';
rq({
method: 'GET',
url: 'https://store.steampowered.com/dynamicstore/userdata/?t=' + Date.now(),
headers: {
'user-agent': my_ua,
'accept': '*/*',
'sec-fetch-site': 'none',
'sec-fetch-mode': 'navigate',
'sec-fetch-user': '?1',
'sec-fetch-dest': 'document',
'cookie': my_cookie
}
})
.then((owns) => {
own = owns.data;
if (own.rgOwnedApps.toString() !== '') {
ownapps = ',' + own.rgOwnedApps.toString() + ',';
ownsubs = ',' + own.rgOwnedPackages.toString() + ',';
own = 'ok';
}
else {
own = 'no';
console.log('Steam App/Sub data not found');
}
})
.finally(() => {
if (own === 'ok') {
fs.writeFile('steam_app.txt', ownapps, (err) => { });
fs.writeFile('steam_sub.txt', ownsubs, (err) => { });
console.log('Steam App/Sub data updated');
if (update_dlc_skip) {
updateSkipdlc();
}
}
else if (own === 'no') {
console.log('Steam App/Sub data not found');
}
else {
console.log('Connection error');
}
});
}
function updateSkipdlc() {
if (ownapps !== '') {
let skipdlc = 'err',
skip_dlc;
rq({
method: 'GET',
url: 'https://bartervg.com/browse/dlc/json/',
headers: {
'user-agent': my_ua
}
})
.then((skipdlcs) => {
skipdlc = skipdlcs.data;
if (Object.keys(skipdlc).length > 7000) {
skip_dlc = ',' + Object.keys(skipdlc).filter(i => ownapps.indexOf(',' + JSON.stringify(skipdlc[i].base_appID).replace(/"/g, '') + ',') === -1).toString() + ',';
}
else {
skipdlc = 'err';
}
})
.finally(() => {
if (skipdlc !== 'err') {
fs.writeFile('steam_skipdlc.txt', skip_dlc, (err) => { });
console.log('DLC_skip data updated');
}
else {
console.log('Connection error');
}
});
}
else {
console.log('DLC_skip data not updated, Steam App data not found');
}
}
function updateDlc() {
let dlc = 'err';
rq({
method: 'GET',
url: 'https://bartervg.com/browse/dlc/json/',
headers: {
'user-agent': my_ua
}
})
.then((dlcs) => {
dlc = dlcs.data;
if (Object.keys(dlc).length > 7000) {
dlc = ',' + Object.keys(dlc).toString() + ',';
}
else {
dlc = 'err';
}
})
.finally(() => {
if (dlc !== 'err') {
fs.writeFile('steam_dlc.txt', dlc, (err) => { });
console.log('DLC data updated');
}
else {
console.log('Connection error');
}
});
}
function updateCard() {
let card = 'err';
rq({
method: 'GET',
url: 'https://bartervg.com/browse/cards/json/',
headers: {
'user-agent': my_ua
}
})
.then((cards) => {
card = cards.data;
if (Object.keys(card).length > 7000) {
card = ',' + Object.keys(card).toString() + ',';
}
else {
card = 'err';
}
})
.finally(() => {
if (card !== 'err') {
fs.writeFile('steam_card.txt', card, (err) => { });
console.log('Card data updated');
}
else {
console.log('Connection error');
}
});
}
function loadFile(lfile) {
if (fs.existsSync(lfile + '.txt')) {
let lread = fs.readFileSync(lfile + '.txt').toString();
return lread;
}
else {
return '';
}
}
