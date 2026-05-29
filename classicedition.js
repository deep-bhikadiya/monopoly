function Square(name, pricetext, color, price, groupNumber, baserent, rent1, rent2, rent3, rent4, rent5) {
	this.name = name;
	this.pricetext = pricetext;
	this.color = color;
	this.owner = 0;
	this.mortgage = false;
	this.house = 0;
	this.hotel = 0;
	this.groupNumber = groupNumber || 0;
	this.price = (price || 0);
	this.baserent = (baserent || 0);
	this.rent1 = (rent1 || 0);
	this.rent2 = (rent2 || 0);
	this.rent3 = (rent3 || 0);
	this.rent4 = (rent4 || 0);
	this.rent5 = (rent5 || 0);
	this.landcount = 0;

	if (groupNumber === 3 || groupNumber === 4) {
		this.houseprice = 50;
	} else if (groupNumber === 5 || groupNumber === 6) {
		this.houseprice = 100;
	} else if (groupNumber === 7 || groupNumber === 8) {
		this.houseprice = 150;
	} else if (groupNumber === 9 || groupNumber === 10) {
		this.houseprice = 200;
	} else {
		this.houseprice = 0;
	}
}

function Card(text, action) {
	this.text = text;
	this.action = action;
}

function corrections() {
	document.getElementById("cell1name").textContent = "Marrakech";
	document.getElementById("cell3name").textContent = "Lisbon";
	document.getElementById("cell14name").textContent = "Tokyo";
	document.getElementById("cell19name").textContent = "Bangkok";
	document.getElementById("cell32name").textContent = "Toronto";

	// Add images to enlarges.
	document.getElementById("enlarge5token").innerHTML += '<img src="images/train_icon.png" height="60" width="65" alt="" style="position: relative; bottom: 20px;" />';
	document.getElementById("enlarge15token").innerHTML += '<img src="images/train_icon.png" height="60" width="65" alt="" style="position: relative; top: -20px;" />';
	document.getElementById("enlarge25token").innerHTML += '<img src="images/train_icon.png" height="60" width="65" alt="" style="position: relative; top: -20px;" />';
	document.getElementById("enlarge35token").innerHTML += '<img src="images/train_icon.png" height="60" width="65" alt="" style="position: relative; top: -20px;" />';
	document.getElementById("enlarge12token").innerHTML += '<img src="images/electric_icon.png" height="60" width="48" alt="" style="position: relative; top: -20px;" />';
	document.getElementById("enlarge28token").innerHTML += '<img src="images/water_icon.png" height="60" width="78" alt="" style="position: relative; top: -20px;" />';
}

function utiltext() {
	return '&nbsp;&nbsp;&nbsp;&nbsp;If one utility network is owned rent is 4 times amount shown on dice.<br /><br />&nbsp;&nbsp;&nbsp;&nbsp;If both utility networks are owned rent is 10 times amount shown on dice.';
}

function transtext() {
	return '<div style="font-size: 14px; line-height: 1.5;">Rent<span style="float: right;">$25.</span><br />If 2 transit hubs are owned<span style="float: right;">50.</span><br />If 3 &nbsp; &nbsp; " &nbsp; &nbsp; " &nbsp; &nbsp; "<span style="float: right;">100.</span><br />If 4 &nbsp; &nbsp; " &nbsp; &nbsp; " &nbsp; &nbsp; "<span style="float: right;">200.</span></div>';
}

function luxurytax() {
	addAlert(player[turn].name + " paid $100 for landing on Luxury Tax.");
	player[turn].pay(100, 0);

	$("#landed").show().text("You landed on Luxury Tax. Pay $100.");
}

function citytax() {
	addAlert(player[turn].name + " paid $200 for landing on City Tax.");
	player[turn].pay(200, 0);

	$("#landed").show().text("You landed on City Tax. Pay $200.");
}

var square = [];

square[0] = new Square("GO", "COLLECT $200 SALARY AS YOU PASS.", "#FFFFFF");
square[1] = new Square("Marrakech", "$60", "#8B4513", 60, 3, 2, 10, 30, 90, 160, 250);
square[2] = new Square("World Fund", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[3] = new Square("Lisbon", "$60", "#8B4513", 60, 3, 4, 20, 60, 180, 320, 450);
square[4] = new Square("City Tax", "Pay $200", "#FFFFFF");
square[5] = new Square("Heathrow Express", "$200", "#FFFFFF", 200, 1);
square[6] = new Square("CapeTown", "$100", "#87CEEB", 100, 4, 6, 30, 90, 270, 400, 550);
square[7] = new Square("Travel Card", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[8] = new Square("Sydney", "$100", "#87CEEB", 100, 4, 6, 30, 90, 270, 400, 550);
square[9] = new Square("Vancouver", "$120", "#87CEEB", 120, 4, 8, 40, 100, 300, 450, 600);
square[10] = new Square("Just Visiting", "", "#FFFFFF");
square[11] = new Square("Dubai", "$140", "#FF0080", 140, 5, 10, 50, 150, 450, 625, 750);
square[12] = new Square("Global Power Grid", "$150", "#FFFFFF", 150, 2);
square[13] = new Square("Singapore", "$140", "#FF0080", 140, 5, 10, 50, 150, 450, 625, 750);
square[14] = new Square("Tokyo", "$160", "#FF0080", 160, 5, 12, 60, 180, 500, 700, 900);
square[15] = new Square("Shinkansen Line", "$200", "#FFFFFF", 200, 1);
square[16] = new Square("Istanbul", "$180", "#FFA500", 180, 6, 14, 70, 200, 550, 750, 950);
square[17] = new Square("World Fund", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[18] = new Square("Rio", "$180", "#FFA500", 180, 6, 14, 70, 200, 550, 750, 950);
square[19] = new Square("Bangkok", "$200", "#FFA500", 200, 6, 16, 80, 220, 600, 800, 1000);
square[20] = new Square("Free Parking", "", "#FFFFFF");
square[21] = new Square("Paris", "$220", "#FF0000", 220, 7, 18, 90, 250, 700, 875, 1050);
square[22] = new Square("Travel Card", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[23] = new Square("Barcelona", "$220", "#FF0000", 220, 7, 18, 90, 250, 700, 875, 1050);
square[24] = new Square("Rome", "$240", "#FF0000", 240, 7, 20, 100, 300, 750, 925, 1100);
square[25] = new Square("Dubai Metro", "$200", "#FFFFFF", 200, 1);
square[26] = new Square("Seoul", "$260", "#FFFF00", 260, 8, 22, 110, 330, 800, 975, 1150);
square[27] = new Square("HongKong", "$260", "#FFFF00", 260, 8, 22, 110, 330, 800, 975, 1150);
square[28] = new Square("Global Water Grid", "$150", "#FFFFFF", 150, 2);
square[29] = new Square("MexicoCity", "$280", "#FFFF00", 280, 8, 24, 120, 360, 850, 1025, 1200);
square[30] = new Square("Go to Jail", "Go directly to Jail. Do not pass GO. Do not collect $200.", "#FFFFFF");
square[31] = new Square("Berlin", "$300", "#008000", 300, 9, 26, 130, 390, 900, 1100, 1275);
square[32] = new Square("Toronto", "$300", "#008000", 300, 9, 26, 130, 390, 900, 1100, 1275);
square[33] = new Square("World Fund", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[34] = new Square("AbuDhabi", "$320", "#008000", 320, 9, 28, 150, 450, 1000, 1200, 1400);
square[35] = new Square("JFK AirTrain", "$200", "#FFFFFF", 200, 1);
square[36] = new Square("Travel Card", "FOLLOW INSTRUCTIONS ON TOP CARD", "#FFFFFF");
square[37] = new Square("Zurich", "$350", "#0000FF", 350, 10, 35, 175, 500, 1100, 1300, 1500);
square[38] = new Square("LUXURY TAX", "Pay $100", "#FFFFFF");
square[39] = new Square("Monaco", "$400", "#0000FF", 400, 10, 50, 200, 600, 1400, 1700, 2000);

var communityChestCards = [];
var chanceCards = [];

communityChestCards[0] = new Card("Get out of Jail Free. This visa waiver may be kept until needed or sold.", function(p) { p.communityChestJailCard = true; updateOwned();});
communityChestCards[1] = new Card("Your travel photo wins second prize. Collect $10.", function() { addamount(10, 'World Fund');});
communityChestCards[2] = new Card("Foreign exchange swings in your favor. Collect $50.", function() { addamount(50, 'World Fund');});
communityChestCards[3] = new Card("Global insurance policy matures. Collect $100.", function() { addamount(100, 'World Fund');});
communityChestCards[4] = new Card("You receive an international tax refund. Collect $20.", function() { addamount(20, 'World Fund');});
communityChestCards[5] = new Card("Your holiday fund matures. Receive $100.", function() { addamount(100, 'World Fund');});
communityChestCards[6] = new Card("You inherit $100 from a relative abroad.", function() { addamount(100, 'World Fund');});
communityChestCards[7] = new Card("Receive a $25 consulting fee for a cross-border deal.", function() { addamount(25, 'World Fund');});
communityChestCards[8] = new Card("Pay overseas medical fees of $100.", function() { subtractamount(100, 'World Fund');});
communityChestCards[9] = new Card("International bank error in your favor. Collect $200.", function() { addamount(200, 'World Fund');});
communityChestCards[10] = new Card("Pay school tuition abroad of $50.", function() { subtractamount(50, 'World Fund');});
communityChestCards[11] = new Card("Travel clinic fee. Pay $50.", function() { subtractamount(50, 'World Fund');});
communityChestCards[12] = new Card("It is your birthday. Collect $10 from every player.", function() { collectfromeachplayer(10, 'World Fund');});
communityChestCards[13] = new Card("Advance to GO. Collect $200.", function() { advance(0);});
communityChestCards[14] = new Card("You are assessed for city repairs. $40 per house. $115 per hotel.", function() { streetrepairs(40, 115);});
communityChestCards[15] = new Card("Go to Jail. Go directly to Jail. Do not pass GO. Do not collect $200.", function() { gotojail();});


chanceCards[0] = new Card("GET OUT OF JAIL FREE. This embassy note may be kept until needed or traded.", function(p) { p.chanceJailCard=true; updateOwned();});
chanceCards[1] = new Card("Make general repairs on all your property. For each house pay $25. For each hotel $100.", function() { streetrepairs(25, 100);});
chanceCards[2] = new Card("Pay a customs penalty of $15.", function() { subtractamount(15, 'Travel Card');});
chanceCards[3] = new Card("You are elected chair of the world trade summit. Pay each player $50.", function() { payeachplayer(50, 'Travel Card');});
chanceCards[4] = new Card("Go back three spaces.", function() { gobackthreespaces();});
chanceCards[5] = new Card("Advance to the nearest utility network. If unowned, you may buy it from the bank. If owned, throw dice and pay owner ten times the amount thrown.", function() { advanceToNearestUtility();});
chanceCards[6] = new Card("Your international portfolio pays a dividend of $50.", function() { addamount(50, 'Travel Card');});
chanceCards[7] = new Card("Advance to the nearest transit hub. If unowned, you may buy it from the bank. If owned, pay owner twice the rental to which they are otherwise entitled.", function() { advanceToNearestRailroad();});
chanceCards[8] = new Card("Pay a travel tax of $15.", function() { subtractamount(15, 'Travel Card');});
chanceCards[9] = new Card("Catch the Heathrow Express. If you pass GO collect $200.", function() { advance(5);});
chanceCards[10] = new Card("Advance to Monaco.", function() { advance(39);});
chanceCards[11] = new Card("Advance to Rome. If you pass GO collect $200.", function() { advance(24);});
chanceCards[12] = new Card("Your development loan matures. Collect $150.", function() { addamount(150, 'Travel Card');});
chanceCards[13] = new Card("Advance to the nearest transit hub. If unowned, you may buy it from the bank. If owned, pay owner twice the rental to which they are otherwise entitled.", function() { advanceToNearestRailroad();});
chanceCards[14] = new Card("Advance to Dubai. If you pass GO collect $200.", function() { advance(11);});
chanceCards[15] = new Card("Go to Jail. Go directly to Jail. Do not pass GO. Do not collect $200.", function() { gotojail();});
