var http = require("http");
var url = require("url");
var io = require("socket.io");

var fs = require('fs'); // File System


function start(route, handle) {
	function onRequest(request, response) {
		var postData = "";
		var pathname = url.parse(request.url).pathname;
		//console.log("Server: Request for " + pathname + " received.");
		
		request.setEncoding("utf8");

		request.addListener("data", function(postDataChunk) {
			postData += postDataChunk;
			//console.log("Server: Received POST data chunk '"+
			//postDataChunk + "'.");
		});

		request.addListener("end", function() {
			route(handle, pathname, response, postData);
		});
	}
	
	function remove(client) {
		// broadcast the connection
		if(typeof clients[client.id] !== 'undefined')
		{
			clients[client.id].get('name', function (err, name) { 
				//console.log("Server: received disconnect message from "+name);
				socket.sockets.emit('removeFriends',{message: name});	
			});
			
			delete clients[client.id]; // delete the client from the list
			//client.broadcast({ message: client.sessionId + ' is no longer available' }); 
		}
	}
	
	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(needle) {
			for(var i = 0; i < this.length; i++) {
				if(this[i] === needle) {
					return i;
				}
			}
			return -1;
		};
	}

	function newBox() {
		console.log("newBox()");
		if(game == 11)
		{
			//console.log("10 rounds done.. New Column")
			game = 1;
			sheetColumn = sheetColumn + 1;
			sheetRow = 0;
		}
		else
		{
			var skip = 0;
			for(var d=0; d < lastDigits.length; d++)
			{
				//console.log("Digit: "+lastDigits[d]);
				if((parseInt(lastDigits[d]) % 2) == 1)
					skip++;
			}
			
			if(game > 1)
				skip = skip + 1;
			console.log("Skip: "+skip);				
			
			var skippedCount = 0;
			while(skippedCount != skip)
			{
				sheetRow = sheetRow + 1;
				if(sheetRow > 14)
					sheetRow = 0;
				if(sheetLog.indexOf(upr[sheetRow]+sheetColumn)==-1)
				{
					skippedCount++;
					console.log("Skipping : "+upr[sheetRow]+sheetColumn);
				}
			}
		}
		lastDigits=[];
		sheetLog.push(upr[sheetRow]+sheetColumn);
		return upr[sheetRow]+sheetColumn;
	}
	
	function newGame() {
		console.log("newGame()");
		chalCount=0;
		chalRound=0;
		chalPlayer=null;
		round1Player=null;
		prevPlayer=null;
		lastMove=null;
		isDoubledForSix = false;
		isRaisedForPlayerBy = 0;
	
		game++;
		console.log("New Game : "+game);
		console.log("Before new game: incomingMultiple = "+incomingMultiple + " , outgoingMultiple = "+outgoingMultiple
		+ " , bidMultiple = "+bidMultiple);
		incomingMultiple=bidMultiple;
		outgoingMultiple=1;
		bidMultiple = 1;
		// On the final hand of a slip, incoming multiple is doubled
		if(game == 10)
			incomingMultiple = incomingMultiple * 2;
		console.log("After new game: incomingMultiple = "+incomingMultiple + " , outgoingMultiple = "+outgoingMultiple
		+ " , bidMultiple = "+bidMultiple);
		
		socket.sockets.emit('newgame',{message: game});
		var newbox = newBox();
		socket.sockets.emit('incomingMultiple',{message: incomingMultiple});
		socket.sockets.emit('bidMultiple',{message: bidMultiple});
		socket.sockets.emit('play',{message: newbox.toString()});
	}

	var isDoubledForSix = false;
	var isRaisedForPlayerBy = 0;
	
	function updateMultiple(bid){
	
		console.log("updateMultiple()");
		console.log("Bid: "+bid);
		var bidParts = bid.split(" ");
		var bidcount = parseInt(bidParts[0]);
		var bidDigit = parseInt(bidParts[1]);
		
		var RaiseBy = 0;
		if((bidcount - noOfPlayers) > 2 && (bidcount - noOfPlayers)%2 == 1){
			RaiseBy = Math.floor((bidcount - noOfPlayers)/2) + 1;
		}
		else if((bidcount - noOfPlayers) > 2 && (bidcount - noOfPlayers)%2 == 0){
			RaiseBy = Math.floor((bidcount - noOfPlayers)/2);
		}
		
		// Raise only if not already same
		if(isRaisedForPlayerBy < RaiseBy)
		{
			//Remove effect of prev raise
			if(isRaisedForPlayerBy!=0)
				bidMultiple = bidMultiple / isRaisedForPlayerBy;
				
			isRaisedForPlayerBy = RaiseBy;
			bidMultiple = bidMultiple * isRaisedForPlayerBy;			
		}
		
		// If the final bid is on a 6, double the bidMultiple
		if(bidDigit == "6"){
			//console.log("6 on the bet doubles the bidMultiple");
			if(!isDoubledForSix)
			{
				bidMultiple = bidMultiple * 2;
				isDoubledForSix = true;
			}
		}
		else
		{
			if(isDoubledForSix){
				bidMultiple = bidMultiple / 2;
				isDoubledForSix = false;
			}	
		}
		
		outgoingMultiple = incomingMultiple * bidMultiple;
		console.log("After turn update: incomingMultiple = "+incomingMultiple + " , outgoingMultiple = "+outgoingMultiple
		+ " , bidMultiple = "+bidMultiple);
		socket.sockets.emit('incomingMultiple',{message: incomingMultiple});
		socket.sockets.emit('bidMultiple',{message: bidMultiple});
	}
	
	Object.size = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};
	
	Object.contains = function(a,obj) {
		//console.log("Checking for "+obj+" in "+a);
		var contains = false;
		for (key in a) {
			a[key].get('name', function (err, name) {
				//console.log("Name: "+ name+", Obj = "+ obj);
				if (name === obj) {
					//console.log("Contains = true");
					contains = true;
				}
			});
		}
		return contains;
	};

	Object.atIndex = function(obj, index){
		var first; var count = 0;
		for (var i in obj) {
			obj[i].get('name', function (err, name) { 
				//console.log(count+' : '+ name);
			});						
			
			if (obj.hasOwnProperty(i) && typeof(i) !== 'function') {
				first = obj[i];
				if(count == index)		
					break;
				count++;
			}
		}
		return first;
	};
		
	var server = http.createServer(onRequest).listen(8888);
	//console.log("Server: Server has started.");
	

	// listen to the server
	var socket = io.listen(server);
	socket.configure(function(){
	  socket.set('log level', 1);
	});
	var upr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var clients = {};
	var turn= 0;
	var game= 0;
	var chalCount=0;
	var chalRound=0;
	var chalPlayer;
	var round1Player;
	var prevPlayer;
	var lastMove;
	var lastDigits=[];
	var sheetColumn=3;
	var sheetRow=0;
	var sheetLog=[];
	var noOfPlayers = 3;
	
	var incomingMultiple=1;
	var bidMultiple=1;
	var outgoingMultiple=1;

	// on a connection, do stuff
	socket.sockets.on('connection', function(client){
		if(Object.size(clients) == noOfPlayers){
			client.emit('message',{ message: "Already have desired number of players. Please try again later" } );
			client.emit('disconnect');
		}
		
		// when the server gets a message, during a connection, broadcast the message
		client.on('message', function(msg)
			{ 
				//console.log("Server: received message : "+ msg.message);
				if(msg.message === "remove")
				{
					remove(client);
				}
				else
				{
					// If its not a remove message, it must be a turn
					turn++;
					if(turn >= Object.size(clients))
						turn = 0;
							
					for(var i in clients)
					{
						//console.log("i : "+ i+" i.id: "+ clients[i].id);
						if(clients[i].id !== client.id)
						{
							client.get('name', function (err, name) { 
								clients[i].emit('message',{ message: name + ': ' + msg.message })
								}); 
						}
					}
						
					if(msg.message=='Ct')
					{
						console.log("Player requested count");
							
						//Since we should start with the same player again
						turn--;
						if(turn < 0)
							turn = Object.size(clients) - 1;
						
						var splitMove = lastMove.split(" ");
						//console.log("Count: "+splitMove[0]+" , Bid: "+splitMove[1]);
									
						var bidcount = 0;
						var biddercount = 0;
						var bidcountReached = false;
						for(var i in clients)
						{
							clients[i].get('sequence', function (err, seq) { 
								//console.log("Checking : "+seq+ " v/s Bid : "+ splitMove[1]);
								for(var c=0; c < seq.toString().length; c++)
								{
									//console.log("\tChecking : "+seq.toString().charAt(c)+ " v/s Bid : "+ splitMove[1]);
									if(seq.toString().charAt(c) == splitMove[1]){
										bidcount++;
										
										//Get the count of the bid in the challenged bidder's sequence to detect none / hero bids
										if(client.id == clients[i].id)
											biddercount++;
									}
									if(bidcount >= splitMove[0])
									{
										bidcountReached = true;
										//break;
									}
								}		
								//console.log("Bid Count : "+ bidcount);
							});
						}
						

						client.get('name', function (err, name) { 
							if(bidcountReached)
							{
								// HERO BID: If the bidder does not have the bid but the count is still made by other players' hands
								if(biddercount == 0)
								{
									console.log("Reached target bid count with HERO bid. Player "+name+" wins");
									socket.sockets.emit('message',{message: "HERO bid!!! There are "+bidcount+" "+splitMove[1]+"'s, "+name+" wins "
									+(outgoingMultiple * (Object.size(clients) - 1))+" units."});
									
									bidMultiple = bidMultiple + 1;
									outgoingMultiple = incomingMultiple * bidMultiple;
									
									// Player earns outgoingMultiple (incomingMultiple * bidMultiple)
									for(var i in clients)
									{
										if(clients[i].id == client.id)
											socket.sockets.emit('score',{message: name+":"+ game+":"
											+ (outgoingMultiple * (Object.size(clients) - 1))});
										else{
											clients[i].get('name', function (err, player) { 
												socket.sockets.emit('score',{message: player+":"+ game+":"+(-1 * outgoingMultiple)});
											});
										}
									}
									bidMultiple = 2;
								}
								else
								{
									console.log("There are "+bidcount+" "+splitMove[1]+"'s, "+name+" wins "
									+(outgoingMultiple * (Object.size(clients) - 1))+" units.");
									
									socket.sockets.emit('message',{message: "There are "+bidcount+" "+splitMove[1]+"'s, "+name+" wins "
									+(outgoingMultiple * (Object.size(clients) - 1))+" units."});
									
									//console.log("Reached target bid count. Player "+name+" wins");
									//socket.sockets.emit('message',{message: "Reached target bid count. Player "+name+" wins"});
									
									// Player earns outgoingMultiple (incomingMultiple * bidMultiple)
									for(var i in clients)
									{
										if(clients[i].id == client.id)
											socket.sockets.emit('score',{message: name+":"+ game+":"
											+ (outgoingMultiple * (Object.size(clients) - 1))});
										else{
											clients[i].get('name', function (err, player) { 
												socket.sockets.emit('score',{message: player+":"+ game+":"+(-1 * outgoingMultiple)});
											});
										}
									}
								}
							}
							else
							{
								// NONE BID: If the bidder does not have the bid and noone else at the table has it either, it is a NONE bid
								if(bidcount == 0 && biddercount == 0)
								{
									console.log("None bid!!");
									bidMultiple = (2 * noOfPlayers) - 6;
									outgoingMultiple = incomingMultiple * bidMultiple;
									socket.sockets.emit('message',{message: "None bid!!! There are "+bidcount+" "+splitMove[1]+"'s, "
									+name+" wins "+(outgoingMultiple * (Object.size(clients) - 1))+" units."});
									
									// Player earns outgoingMultiple
									for(var i in clients)
									{
										if(clients[i].id == client.id)
											socket.sockets.emit('score',{message: name+":"+ game+":"
											+(outgoingMultiple * (Object.size(clients) - 1))});
										else{
											clients[i].get('name', function (err, player) { 
												socket.sockets.emit('score',{message: player+":"+ game+":"+(-1 * outgoingMultiple)});
											});
										}	
									}
									bidMultiple = 2;									
								}
								else{
									//console.log("Failed to Reach target bid count. Player "+name+" loses");
									//socket.sockets.emit('message',{message: "Failed to Reach target bid count. Player "+name+" loses"});
									
									console.log("There are "+bidcount+" "+splitMove[1]+"'s, "+name+" loses "
									+(-1 * incomingMultiple * (Object.size(clients) - 1))+" units.");
									
									socket.sockets.emit('message',{message: "There are "+bidcount+" "+splitMove[1]+"'s, "+name+" loses "
									+(incomingMultiple * (Object.size(clients) - 1))+" units."});
									
									// Player owes incoming multiple
									for(var i in clients)
									{
										if(clients[i].id == client.id)
											socket.sockets.emit('score',{message: name+":"+ game+":"
											+(-1 * incomingMultiple * (Object.size(clients) - 1))});
										else{
											clients[i].get('name', function (err, player) { 
												socket.sockets.emit('score',{message: player+":"+ game+":"+incomingMultiple});
											});
										}	

									}
								}
							}
						});
						
						newGame();
						
					}					
					else if(msg.message=='Ch')
					{
						console.log("Player challenged");
												
						//Increment the challenge count with every challenge
						chalCount++;
						
						//With the first challenge message, remember who is being challeged
						if(chalCount == 1){
							chalPlayer = prevPlayer;
						}
						
						// If all players have challenged the player being challenged, i.e. count = no of players - 1
						if(chalCount == (Object.size(clients) - 1)){
							// increment the count of challenge round
							chalRound ++;
							
							if(chalRound == 1)
							{
								// At the end of challenge round 1, the challenged player can increase bet or count
								socket.sockets.emit('challenge1', {message: chalPlayer});
								round1Player = chalPlayer;
							}
							// Check if round 2 is for the same player as last time
							else if(chalRound == 2 && chalPlayer == round1Player)
							{
								// At the end of challenge round 2, game is over and we count
								socket.sockets.emit('challenge2', {message: chalPlayer});
								//newGame();
							}
							// If round 2 is for a diff player, treat that as round 1 for this player
							else if(chalRound == 2 && chalPlayer != round1Player)
							{
								chalRound = 1;
								socket.sockets.emit('challenge1', {message: chalPlayer});
								round1Player = chalPlayer;
							}
						}
					}
					// When someone sends a non challenge message, we reset counts and start over
					else
					{
						console.log("Player : "+msg.message);							
					
						// Set non challenge/count move as prev move for next turn
						lastMove = msg.message;	
						updateMultiple(msg.message);
						
						if(chalCount > 0)
						{
							chalCount = 0;
							chalPlayer = "";
						}
					}
					
					Object.atIndex(clients,turn).get('name', function (err, name) { 
						console.log("Next Player "+name);
						socket.sockets.emit('begin',{message: name});
					});		

					
					//Set prev player for next game
					client.get('name', function (err, name) { 
						prevPlayer = name;
					});
					
				}
			}
		);
		
		client.on('chat',function(msg){
			for(var i in clients)
			{
				if(clients[i].id !== client.id)
				{
					client.get('name', function (err, name) { 
						clients[i].emit('chat',{ message: name + ': ' + msg.message })
						}); 
				}
			}
		});
		
		// Register sequence per client
		client.on('register', function(seq)
		{ 
			//console.log("Server: Received Name : "+ seq.seq + " from : "+client.id);
			for(var i in clients)
			{
				if(clients[i].id !== client.id)
				{
					client.get('name', function (err, name) { 
							//clients[i].emit('message',{ message: name + ' registered their sequence'}); 
							//console.log(name + " registered their sequence"); 
						});
				}
				else
				{
					clients[i].set('sequence',seq.seq,function () {});
					lastDigits.push(seq.seq.charAt(seq.seq.length - 1));
					//console.log("Adding : "+ seq.seq.charAt(seq.seq.length - 1) +"lastDigits.length : " + lastDigits.length);
				}					
			}
		});
			
		// when the server gets a name, during a connection, broadcast the message
		client.on('name', function(name)
			{ 
				console.log("Server: Received Name : "+ name.name + " from : "+client.id);
				
				// remember the client by associating the client.id with the client
				if(Object.contains(clients,name.name))
				{
					client.emit('message',{ message: 'Username is already taken. Please try a different name.'});
				}
				else
				{
					if(Object.size(clients) != noOfPlayers)
					{
						game = 0;
						sheetColumn = 3;
						sheetRow = 0;
						outgoingMultiple = 1;
						bidMultiple = 1;
					}	
					clients[client.id] = client; 
					
					for(var i in clients)
					{
						if(clients[i].id !== client.id)
						{
							clients[i].emit('message',{ message: name.name + ' is now available'}); 
						}
						else
						{
							clients[i].set('name',name.name,function () {});
							clients[i].emit('successfulLogin',{message: 'User ' +name.name +" Logged in."});
						}
							
						// broadcast the connection
						clients[i].emit('updateFriends',{message: name.name});	
					}
					
					//console.log("No of players : "+ Object.size(clients));
					
					for(var i in clients)
					{
						// broadcast the connection
						clients[i].get('name', function (err, name) { 
							if(name !== null && name !== "remove"){
								socket.sockets.emit('updateFriends',{message: name});	
							}
						});
					}
					
					if(Object.size(clients) == noOfPlayers){	
						game = 0;
						sheetColumn = 3;
						sheetRow = 0;
						outgoingMultiple = 1;
						bidMultiple = 1;
						Object.atIndex(clients,turn).get('name', function (err, name) { 
							newGame();
							console.log("Next Player when noOfplayers = size of clients : "+name);
							socket.sockets.emit('begin',{message: name});
						});						
					}
						
				}
			
			}
		);
		
		client.on('sessionStart', function (message) {
			// get the client.id of the partner on each message
			var partner = message.from; 
			//console.log("Server: Partner : "+ partner);
			if (clients[partner]) {
			  // check if the partner exists and send a message to the user
			  clients[client.id].emit('message', { from: partner, msg: message });
			}
		});

		
		// when the server gets a disconnect, during a connection, broadcast the disconnection
		client.on('disconnect', function()
			{ 
				remove(client);
			}
		);
	});

}

exports.start = start;