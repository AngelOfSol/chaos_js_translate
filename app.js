// ==UserScript==
// @name         Chaos TCG
// @namespace    http://people.rit.edu/~jck5199/
// @version      0.3
// @description  Renders English onto chaos cards
// @author       Julien Kilian
// @include      http://chaos-tcg.com/cardlist/?cardno=*
// @grant        none
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require      https://raw.githubusercontent.com/AngelOfSol/chaos_js_translate/master/rule_list.js
// @update       https://raw.githubusercontent.com/AngelOfSol/chaos_js_translate/master/app.js
// ==/UserScript==

/// CHECKING FOR UPDATES

function th(row, col) {
	if (col == undefined) {
		return $(".status > tbody > tr:eq(" + row + ") > th");
	} else {
		return $(".status > tbody > tr:eq(" + row + ") > th:eq(" + col + ")");

	}
}
function tbl(row, col) {
	return $(".status > tbody > tr:eq(" + row + ") > td:eq(" + col + ")");
}

function pickoff(line) {
	var done = false;
	var target = ' ';
	var cur = 0;
	do {
		switch (target) {
			case ' ':
				switch (line.charAt(cur)) {
					case '【':
						target = '】';
						break;
					case '<':
						target = '>';
						break;
					case '[':
						target = '］';
						break;
					case '［':
						target = '］';
						break;
					case '〔':
						target = '〕';
						break;
					default:
						done = true;
						break;
				}
				break;
			default:
				if(target == line.charAt(cur)) {
					target = ' ';
				}
				break;
		}
		cur++;
	} while(!done);
	cur -= 1;
	return {lhs: line.slice(0, cur), rhs: line.slice(cur)};
}

th(0).html("Card Name");
th(1).html("Card No.");
th(2, 0).html("Gender");
th(2, 1).html("Rarity");
th(3, 0).html("Card Type");
th(3, 1).html("Attribute");
th(4, 0).html("Attack");
th(4, 1).html("Defense");
th(5, 0).html("Attack (Gain)");
th(5, 1).html("Defense (Gain)");
th(6).html("Rules Text");
th(7).html("Flavor");
th(8).html("Expansion");
th(9).html("Work");

var gender = tbl(2,0).html();

switch (gender) {
	case "女": 
		gender = "Female";
		break;
	case "男":
		gender = "Male";
		break;
	default:
		gender = "N/A";
		break;
}
tbl(2, 0).html(gender);

var rules = tbl(6, 0).html();

rules = rules.replace("[", "［");


var capitalizer = /(］|・|〔|〕|。|^)(.)/g;

rules = rules.replace(/\[/g, "［");
rules = rules.replace(/\]/g, "］");
rules = rules.replace(/1/g, "１");
rules = rules.replace(/:/g, "：");


var quote_remover = /(《([^0-9》]+)》|「([^0-9」]+)」|＜([^0-9＞]+)＞)/;

var quoted = [];

var matches;
matches = rules.match(quote_remover);
while(matches != null) {
	var name = "";
	var done = false;
	for(var i = 2; name == ""; i++) {
		name = matches[i] || "";
	}
	//console.log(matches);
	rules = rules.replace(new RegExp(name, 'g'), quoted.length);
	quoted.push(name);	
	matches = rules.match(quote_remover);
}



var rules_list = rules.split("<br>");
var old_rules_double = [];
var rules_double = [];
var divide_regex = /^((<.+?>|【使用】|【フレンド】|［自動］|［永続］|【維持】|【登場】|【追加ネーム】|【Main】|【Battle】|【パートナー】|【ターン１】| )*)(.*)/; // match 1 is the left half, match 3 is the right half


//：
// TODO: temporarily remove names from big quotes and re add them afterwords
// do this with quoted names too

for (var j in rules_list) {
	var old = rules_list[j];
	//console.log(old);
	var rule_split = divide_regex.exec(old);
	if (rule_split != null)
	{
		rules_double.push([rule_split[1] , rule_split[3]]);
		old_rules_double.push([rule_split[1] , rule_split[3]]);
		rule_split = old;
	}
}
//console.log(old_rules_double);



var zone_regex = "(控え室|アリーナ|手札|バックヤード)";
var char_type_regex = "(キャラ|フレンド)";

for (var i in replace_rules) {
	var rule = replace_rules[i].split(" => ");
	var lhs = rule[0];
	var rhs = rule[1];
	lhs = lhs.replace(/_/g, "([^。、〔〕,.]+?)");
	var non_first_class = " ";
	var numeral = "\uFF10-\uFF19";
	var non_numeral = "“”を0-9a-zA-Z【】《》：『』＜＞「」\u30A0-\u30FA\u30FC-\u30FF\u3041-\u3090\u3400-\u4DB5\u4E00-\u9FCB\uF900-\uFA6A";
	var char_class = non_numeral + numeral;
	lhs = lhs.replace(/@/g, "([" + char_class + "][" + non_first_class + char_class + "]+)");
	var temp = lhs;
	lhs = lhs.replace(/#/g, "([ " + non_numeral + "]+)");
	lhs = lhs.replace(/ZONE/g, zone_regex);
	lhs = lhs.replace(/CHAR/g, char_type_regex);
	if (temp != lhs)
	{
		////console.log("LOOK HERE: " + lhs);
	}
	lhs = new RegExp(lhs, 'g');
	for(var j in rules_double) {


		var old = [rules_double[j][0], rules_double[j][1]];

		for (var t in rules_double[j]) {
			rules_double[j][t] = rules_double[j][t].replace(lhs, rhs);
		}

		if(old[1] != rules_double[j][1]) { //console.log(rules_double[j][1]); //console.log(" !from! " + lhs);} 
	}
}

for(var j in rules_double) {


	var old = [rules_double[j][0], rules_double[j][1]];

	for (var t in rules_double[j]) {
		rules_double[j][t] = rules_double[j][t].replace(capitalizer, function (letter) {
			return letter.toUpperCase();
		});
	}
}

var new_rules = [];
for (var t in rules_double) {
	new_rules.push(rules_double[t].join(""));
}
rules = new_rules.join("<br>");

for(var t in quoted) {
	rules = rules.replace(new RegExp(t, 'g'), quoted[t]);	
}

tbl(6, 0).html(rules);