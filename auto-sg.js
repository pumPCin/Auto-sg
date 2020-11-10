#!/usr/bin/env node
'use strict';
const jsdom = require('jsdom');
const $ = require('jquery')(new jsdom.JSDOM().window);
const fs = require('fs');
const rq = require('axios').default;
const my_url = 'https://www.steamgifts.com';
const my_white = loadFile('whitelist');
const my_black = loadFile('blacklist');
const my_ownapps = loadFile('steam_app');
const my_ownsubs = loadFile('steam_sub');
const my_dlc = loadFile('steam_dlc');
const my_card = loadFile('steam_card');
const my_ua = loadFile('user-agent');
const my_cookie = loadFile('sg_cookie');
//
// Default settings
//
const interval_from = 5;
const interval_to = 10;
const check_in_steam = true;
const blacklist_on = false;
const pages = 3;
const ending = 0;
const min_chance = 0;
const min_entries = 0;
const min_level = 0;
const max_level = 0;
const min_cost = 0;
const max_cost = 0;
const points_reserve = 0;
const whitelist_only = false;
const wishlist_only = false;
const group_only = false;
const whitelist_first = false;
const wishlist_first = true;
const group_first = false;
const card_only = false;
const reserve_on_wish = false;
const reserve_on_group = false;
const card_first = false;
const ignore_on_wish = false;
const ignore_on_group = false;
const multiple_first = false;
const sort_by_copies = false;
const hide_ga = true;
const free_ga = true;
const sort_by_level = false;
const remove_ga = true;
const skip_dlc = false;
const sort_by_chance = false;
//
//
let call = -1,
my_username = '',
my_value = 0,
my_level = 0,
my_token = '',
my_dsave = ',',
my_giveaways = [];
rq({
method: 'GET',
url: my_url,
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': my_url + '/',
'cookie': my_cookie
},
responseType: 'document'
})
.then((htmls) => {
let html = htmls.data;
if (html.indexOf('>Logout<') >= 0) {
call = 1;
}
else {
call = 0;
}
})
.finally(() => {
if (call === 1) {
console.log('Session found');
rq({
method: 'GET',
url: my_url + '/account/settings/profile',
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': my_url + '/',
'cookie': my_cookie
},
responseType: 'document'
})
.then((data) => {
data = $(data.data);
my_username = data.find('input[name=username]').val();
my_value = data.find('.nav__points').text();
my_level = data.find('.nav__points').next().text().replace('Level ', '');
})
.finally(() => {
if (my_username !== '') {
console.log('Account: ' + my_username + ' Level: ' + my_level + ' Points: ' + my_value);
joinService();
}
else {
console.log('Connection error');
}
});
}
else if (call === 0) {
console.log('Session not found');
}
else {
console.log('Connection error');
}
});
function joinService() {
let page = -1;
let processCommon = () => {
if (page <= pages) {
giveawaysFromUrl(page, processCommon);
}
else {
giveawaysEnter();
}
page++;
};
processCommon();
}
function giveawaysFromUrl(page, callback) {
let sgurl = my_url + '/giveaways/search?',
sgtype = 'p',
sgpage = page;
if (sgpage === -1) {
sgurl = sgurl + 'type=wishlist';
sgtype = 'w';
}
else if (sgpage === 0) {
sgurl = sgurl + 'type=group';
sgtype = 'g';
}
else {
sgurl = sgurl + 'page=' + sgpage;
}
rq({
method: 'GET',
url: sgurl,
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': my_url + '/',
'cookie': my_cookie
},
responseType: 'document'
})
.then((data) => {
data = $('<div>' + data.data + '</div>');
my_token = data.find('input[name="xsrf_token"]').val();
if (my_token.length < 10) {
return;
}
if (sgpage === -1) {
let sgwon = parseInt(data.find('.nav__button-container--active.nav__button-container--notification.nav__button-container:nth-of-type(2) > .nav__button > .nav__notification').text().trim());
if (isNaN(sgwon)) {
sgwon = 0;
}
if (sgwon > 0) {
console.log('!!! Congrats, you won !!! (quantity: ' + sgwon + ')');
fs.writeFile('win.txt', new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString() + sgwon + '\n', (err) => { });
}
}
data.find('.pinned-giveaways__outer-wrap').remove();
data.find('.giveaway__row-outer-wrap').each((index, item) => {
let sgaway = $(item),
copies = 1,
link = my_url + sgaway.find('a.giveaway__heading__name').attr('href'),
entries = parseInt(sgaway.find('.fa.fa-tag+span').text().replace(/[^0-9]/g, '')),
left = sgaway.find('[data-timestamp]').first().text().split(' '),
factor = 1;
switch (left[1]) {
case 'hour': case 'hours': factor = 60; break;
case 'day': case 'days': factor = 1440; break;
case 'week': case 'weeks': factor = 10080; break;
case 'month': case 'months': factor = 40320; break;
}
let cost = sgaway.find('.giveaway__heading__thin').first().text();
if (cost.indexOf('P)') >= 0) {
cost = parseInt(cost.replace(/[^0-9]/g, ''));
}
else if (cost.indexOf('Copies)') >= 0) {
copies = parseInt(cost.replace(/[^0-9]/g, ''));
cost = parseInt(sgaway.find('.giveaway__heading__thin').eq(1).text().replace(/[^0-9]/g, ''));
}
else {
cost = parseInt(sgaway.find('a.giveaway__icon[rel]').prev().text().replace(/[^0-9]/g, ''));
}
let chance = parseFloat(((copies / entries) * 100).toFixed(2));
if (sgtype !== 'p') {
sgpage = sgtype;
}
let GA = {
page: sgpage,
order: (index + 1),
chance: (chance === Infinity ? 0 : chance),
lnk: link,
left: (parseInt(left[0]) * factor),
copies: copies,
entries: entries,
code: link.match(/away\/(.*)\//)[1],
gameid: sgaway.attr('data-game-id'),
nam: sgaway.find('a.giveaway__heading__name').text(),
level: sgaway.find('.giveaway__column--contributor-level').length > 0 ? parseInt(sgaway.find('.giveaway__column--contributor-level').text().replace('+', '').replace('Level ', '')) : 0,
levelPass: sgaway.find('.giveaway__column--contributor-level--negative').length === 0,
cost: cost,
sgsteam: sgaway.find('a.giveaway__icon').attr('href'),
entered: sgaway.find('.giveaway__row-inner-wrap.is-faded').length > 0,
type: sgtype,
card: false,
dlc: false,
white: false
};
if (GA.sgsteam === undefined) {
GA.sgsteam = '';
}
else if (GA.sgsteam.includes('app/')) {
let sgpp = parseInt(GA.sgsteam.split('app/')[1].split('/')[0].split('?')[0].split('#')[0]);
if (my_card.includes(',' + sgpp + ',')) {
GA.card = true;
}
if (my_dlc.includes(',' + sgpp + ',')) {
GA.dlc = true;
}
if (my_white.includes('app/' + sgpp + ',')) {
GA.white = true;
}
}
else if (GA.sgsteam.includes('sub/')) {
let sgps = parseInt(GA.sgsteam.split('sub/')[1].split('/')[0].split('?')[0].split('#')[0]);
if (my_white.includes('sub/' + sgps + ',')) {
GA.white = true;
}
}
else if (GA.sgsteam.includes('bundle/')) {
let sgpb = parseInt(GA.sgsteam.split('bundle/')[1].split('/')[0].split('?')[0].split('#')[0]);
if (my_white.includes('bundle/' + sgpb + ',')) {
GA.white = true;
}
}
if (
(GA.levelPass) &&
(ending === 0 || GA.left <= ending) &&
(GA.type === 'p' || GA.type === 'g' && group_first || GA.type === 'g' && group_only || GA.type === 'w' && wishlist_first || GA.type === 'w' && wishlist_only)
)
my_giveaways.push(GA);
});
})
.finally(() => {
if (callback) {
callback();
}
});
}
function giveawaysEnter(callback) {
let sgcurr = 0,
sga = [],
sgb = [];
if (sort_by_chance) {
my_giveaways.sort((a, b) => {
return b.chance - a.chance;
});
}
if (sort_by_level) {
my_giveaways.sort((a, b) => {
return b.level - a.level;
});
}
if (sort_by_copies) {
my_giveaways.sort((a, b) => {
return b.copies - a.copies;
});
}
if (multiple_first) {
sga = my_giveaways.filter(GA => GA.copies > 1);
sgb = my_giveaways.filter(GA => GA.copies === 1);
my_giveaways = [].concat(sga, sgb);
}
if (card_first) {
sga = my_giveaways.filter(GA => GA.card === true);
sgb = my_giveaways.filter(GA => GA.card === false);
my_giveaways = [].concat(sga, sgb);
}
if (group_first) {
sga = my_giveaways.filter(GA => GA.type === 'g');
sgb = my_giveaways.filter(GA => GA.type !== 'g');
my_giveaways = [].concat(sga, sgb);
}
if (wishlist_first) {
sga = my_giveaways.filter(GA => GA.type === 'w');
sgb = my_giveaways.filter(GA => GA.type !== 'w');
my_giveaways = [].concat(sga, sgb);
}
if (whitelist_first) {
sga = my_giveaways.filter(GA => GA.white === true);
sgb = my_giveaways.filter(GA => GA.white === false);
my_giveaways = [].concat(sga, sgb);
}
if (whitelist_only) {
sga = my_giveaways.filter(GA => GA.white === true);
my_giveaways = sga;
}
if (wishlist_only && !group_only) {
sga = my_giveaways.filter(GA => GA.type === 'w');
my_giveaways = sga;
}
if (group_only && !wishlist_only) {
sga = my_giveaways.filter(GA => GA.type === 'g');
my_giveaways = sga;
}
if (wishlist_only && group_only) {
sga = my_giveaways.filter(GA => GA.type === 'w');
sgb = my_giveaways.filter(GA => GA.type === 'g');
my_giveaways = [].concat(sga, sgb);
}
function processOne() {
if (my_giveaways.length <= sgcurr) {
console.log('Checked pages 1#-' + pages + '#');
if (callback) {
callback(false);
}
return;
}
let sgnext = (Math.floor(Math.random() * (interval_to - interval_from)) + interval_from) * 1000;
let GA = my_giveaways[sgcurr],
sgown = 0,
sgapp = 0,
sgsub = 0,
sgbun = 0,
sgid = '???',
sgref = my_url + '/';
if (GA.page === 'w') {
sgref = sgref + 'giveaways/search?type=wishlist';
}
else if (GA.page === 'g') {
sgref = sgref + 'giveaways/search?type=group';
}
else if (GA.page > 1) {
sgref = sgref + 'giveaways/search?page=' + GA.page;
}
if (GA.sgsteam.includes('app/')) {
sgapp = parseInt(GA.sgsteam.split('app/')[1].split('/')[0].split('?')[0].split('#')[0]);
sgid = 'app/' + sgapp;
}
else if (GA.sgsteam.includes('sub/')) {
sgsub = parseInt(GA.sgsteam.split('sub/')[1].split('/')[0].split('?')[0].split('#')[0]);
sgid = 'sub/' + sgsub;
}
else if (GA.sgsteam.includes('bundle/')) {
sgbun = parseInt(GA.sgsteam.split('bundle/')[1].split('/')[0].split('?')[0].split('#')[0]);
sgid = 'bundle/' + sgbun;
}
if (my_value < GA.cost && GA.cost > 0) {
sgown = 3;
}
if (
(GA.type === 'p') &&
(points_reserve > 0) &&
((my_value - GA.cost) < points_reserve) &&
(GA.cost > 0)
)
{
sgown = 7;
}
if (
(GA.type !== 'w' && !GA.white && GA.dlc && skip_dlc) ||
(GA.type !== 'w' && !GA.white && GA.card && card_only)
)
{
sgown = 8;
}
if (GA.entered) {
sgown = 5;
}
else if (my_giveaways.filter(i => i.code === GA.code && i.entered === true).length > 0) {
sgown = 5;
}
if (check_in_steam) {
if (my_ownapps === '' && my_ownsubs === '') {
sgown = 2;
}
if (my_ownapps.includes(',' + sgapp + ',') && sgapp > 0) {
sgown = 1;
}
if (my_ownsubs.includes(',' + sgsub + ',') && sgsub > 0) {
sgown = 1;
}
}
if (my_black.includes(sgid + ',') && blacklist_on) {
sgown = 4;
}
if (GA.entered && sgown === 1) {
sgown = 6;
}
let sglog = GA.nam;
if (GA.dlc) {
sglog = '⊞ ' + sglog;
}
if (GA.card) {
sglog = '♦ ' + sglog;
}
sglog = '|' + GA.page + '#|' + GA.order + '№|'+ GA.copies + 'x|' + GA.entries + 'e|' + GA.chance + '%|' + GA.level + 'L|' + GA.cost + '$| ' + sglog;
if (my_dsave.includes(',' + sgid + ',') && sgown !== 6) {
sgown = 1;
}
console.log('Checking ' + sglog);
switch (sgown) {
case 1:
console.log('Skipped - already have on Steam account');
break;
case 2:
console.log('Skipped - Steam data not found (need steam app and sub data)');
break;
case 3:
console.log('Skipped - not enough points');
break;
case 4:
console.log('Skipped - giveaway in Blacklist');
break;
case 5:
console.log('Skipped - already joined');
break;
case 6:
console.log('Skipped - already joined, already have on Steam account');
break;
case 7:
console.log('Skipped - not enough points (Reserve of points - ' + points_reserve + ')');
break;
case 8:
console.log('Skipped - giveaway does not fit the service settings');
break;
}
if (sgown === 6 && remove_ga) {
rq({
method: 'POST',
url: my_url + '/ajax.php',
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': sgref,
'cookie': my_cookie
},
data: 'xsrf_token=' + my_token + '&do=entry_delete&code=' + GA.code
})
.then((data) => {
data = data.data;
if (data.type === 'success') {
console.log('Completed to remove giveaway - '+ GA.nam);
my_value = data.points;
GA.entered = false;
}
});
}
if ((sgown === 1 || sgown === 6) && !my_dsave.includes(',' + sgid + ',') && hide_ga) {
sgown = 6;
rq({
method: 'POST',
url: my_url + '/ajax.php',
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': sgref,
'cookie': my_cookie
},
data: 'xsrf_token=' + my_token + '&do=hide_giveaways_by_game_id&game_id=' + GA.gameid
})
.then(() => {
console.log('Completed to hide on site giveaways - ' + GA.nam);
my_dsave = my_dsave + sgid + ',';
});
}
if (
(sgown === 0) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || max_level === 0 || GA.level >= min_level && GA.level <= max_level && max_level > 0) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || GA.cost >= min_cost || GA.cost === 0 && free_ga) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || max_cost === 0 || GA.cost <= max_cost) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || GA.type === 'w' && reserve_on_wish || GA.type === 'g' && reserve_on_group || (my_value - GA.cost) >= points_reserve || GA.cost === 0) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || min_chance === 0 || GA.chance >= min_chance) &&
(GA.type === 'w' && ignore_on_wish || GA.type === 'g' && ignore_on_group || min_entries === 0 || GA.entries >= min_entries)
)
{
rq({
method: 'POST',
url: my_url + '/ajax.php',
headers: {
'authority': 'www.steamgifts.com',
'from': 'esgst.extension@gmail.com',
'user-agent': my_ua,
'esgst-version': '8.8.5',
'content-type': 'application/x-www-form-urlencoded',
'accept': '*/*',
'origin': my_url,
'sec-fetch-site': 'same-origin',
'sec-fetch-mode': 'cors',
'sec-fetch-dest': 'empty',
'referer': sgref,
'cookie': my_cookie
},
data: 'xsrf_token=' + my_token + '&do=entry_insert&code=' + GA.code
})
.then((data) => {
data = data.data;
if (data.type === 'success') {
console.log('Joined to ' + sglog);
my_value = data.points;
GA.entered = true;
}
else {
console.log('Skipped - failed to join giveaway due to an error');
}
});
}
else {
if (sgown === 0) {
console.log('Skipped - giveaway does not fit the service settings');
}
if (sgown !== 6) {
sgnext = 50;
}
}
sgcurr++;
setTimeout(processOne, sgnext);
}
processOne();
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
