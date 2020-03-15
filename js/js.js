var vec = {}; // main game object

vec.init = function() {
	this.unit = 20;
	this.colors = ['#FFA200', '#D61E15', '#C929C2', '#9222D9', '#2AE220', '#355F6C'];
	this.pause = {state: false, active: false, time: 0, diff: 0};
	this.bulletLife = 2;
	this.gameOver = false;
	this.score = 0;
	this.reverse = {time: 0, condition: 5, alive: true}; // [seconds]
	this.reverse.update = function() {
		this.time += vec.timeStep;
		if (this.time > this.condition)
		{
			var d = this.time - this.condition;
			this.time = d;
			vec.dir *= -1;
			var remove = [];
			var cnt = 0;

			vec.bullets.neutral.forEach(function(elm, i) {
				elm.life--;
				if (elm.life < 0)
				{
					elm.kill = true;
					elm.render = false;
					elm.alive = false;
					remove.push(i);
				}
			});
			
			if (remove && remove.length > 0)
			{
				for (var i = 0; i < remove.length; i++)
				{
					if (remove[i] >= 0)
					{
						vec.bullets.neutral.splice(remove[i] - cnt, 1);
						cnt++;
					}
				}
			}
			
			for (var i = 0; i < vec.bullets.player.length; i++)
			{
				vec.bullets.player[i].life--;
				vec.bullets.player[i].source = 'neutral';
				vec.bullets.neutral.push(vec.bullets.player[i]);
			}
			for (var i = 0; i < vec.bullets.enemies.length; i++)
			{
				vec.bullets.enemies[i].life--;
				vec.bullets.enemies[i].source = 'neutral';
				vec.bullets.neutral.push(vec.bullets.enemies[i]);
			}

			vec.bullets.player.length = 0;
			vec.bullets.enemies.length = 0;
		}
	};
	this.lastTime = null;
	this.timeStep = 0;
	this.baseWidth = 480;
	this.baseHeight = 720;
	this.windowWidth = Math.floor(window.innerWidth);
	this.windowHeight = Math.floor(window.innerHeight);
	this.ratioW = this.windowWidth / this.baseWidth;
	this.ratioH = this.windowHeight / this.baseHeight;
	this.maxHealth = 100;

	if (this.ratioW < this.ratioH)
	{
		this.width = Math.floor(this.windowWidth);
		this.height = Math.floor(this.width * this.baseHeight / this.baseWidth);
	}
	else
	{
		this.height = Math.floor(this.windowHeight);
		this.width = Math.floor(this.height * this.baseWidth / this.baseHeight);
	}
	
	this.div = document.getElementById('gameDiv');
	this.div.style.width = this.width + 'px';
	this.div.style.height = this.height + 'px';

	this.widthOld = this.width;
	this.heightOld = this.height;
	this.scaleX = this.width / this.widthOld;
	this.scaleY = this.height / this.heightOld;
	this.halfWidth = Math.floor(this.width / 2);
	this.halfHeight = Math.floor(this.height / 2);
	this.ratioX = this.width / this.baseWidth;	// ratioX * x <- for conversion of coordinates between resize events
	this.ratioY = this.height / this.baseHeight;
	this.factorX = this.unit * this.ratioX;	// factors * movement <- for movement, positions, ... (not directly for coordinates conversion)
	this.factorY = this.unit * this.ratioY;

	this.dir = 1;

	this.ctx = {};

	this.group = {render: [], update: []};

	this.group.update.push(this.reverse);

	this.player = {};
	this.group.render.push(this.player);
	this.group.update.push(this.player);

	this.bullets = {};
	this.bullets.pool = [];
	this.bullets.enemies = [];
	this.bullets.player = [];
	this.bullets.neutral = [];
	this.group.render.push(this.bullets.player);
	this.group.update.push(this.bullets.player);
	this.group.render.push(this.bullets.enemies);
	this.group.update.push(this.bullets.enemies);
	this.group.render.push(this.bullets.neutral);
	this.group.update.push(this.bullets.neutral);

	this.enemies = [];
	this.group.render.push(this.enemies);
	this.group.update.push(this.enemies);

	this.getFirstDead = function(arr) {
		for (var i = 0; i < arr.length; i++)
		{
			if (!arr[i].alive)
			{
				return arr[i];
			}
			else if (i === arr.length - 1)
			{
				return false;
			}
		}
	};
	
	this.timers = {enemy: {elapsed: 0, timer: 4},
				   bonus: {elapsed: 0, timer: 3.5},
				   gameProgress: {elapsed: 0, timer: 10},
				   increaseFireRate: {elapsed: 0, timer: 5}};
	this.spawnSpots = 0.75;
	this.enemyTypes = ['straight', 'straightStop', 'straightStop', 'sin', 'sinStop', 'sinStop'];
	this.enemyBaseSize = 2;
	this.bonuses = ['shield', 'shield', 'shield', 'firerate', 'firerate', 'firepower', 'firepower', 'shipDestruction', 'bulletDestruction', 'changeDirection', 'changeDirection'];
	this.firePowers = ['playerBasicHorizontal', 'playerBasicDiagonalR', 'playerBasicDiagonalL'];
	this.bonusesId = [];
	this.decreaseFireRate = 1.5;
	this.enemyCount = 0;
	this.spawn = {alive: true};
	this.group.update.push(this.spawn);
	this.spawn.update = function() {
		vec.timers.gameProgress.elapsed += vec.timeStep;
		
		if (vec.timers.gameProgress.elapsed > vec.timers.gameProgress.timer)
		{
			var dif = vec.timers.gameProgress.elapsed - vec.timers.gameProgress.timer;
			vec.timers.gameProgress.elapsed = dif;
			if (vec.timers.enemy.timer > 0.9)
			{
				vec.timers.enemy.timer -= 0.3;
			}
			if (vec.timers.bonus.timer > 0.9)
			{
				vec.timers.bonus.timer -= 0.4;
			}
		}

		vec.timers.increaseFireRate.elapsed += vec.timeStep;

		if (vec.timers.increaseFireRate.elapsed > vec.timers.increaseFireRate.timer)
		{
			var dif = vec.timers.increaseFireRate.elapsed - vec.timers.increaseFireRate.timer;
			vec.timers.increaseFireRate = dif;
			if (vec.decreaseFireRate > 0)
			{
				vec.decreaseFireRate -= 0.3;
			}
			if (vec.decreaseFireRate < 0)
			{
				vec.decreaseFireRate = 0;
			}
		}

		vec.timers.enemy.elapsed += vec.timeStep;

		if (vec.timers.enemy.elapsed > vec.timers.enemy.timer || vec.enemyCount < 4)
		{
			if (vec.enemyCount > 0)
			{
				var dif = vec.timers.enemy.elapsed - vec.timers.enemy.timer;
				vec.timers.enemy.elapsed = dif;
			}

			var rndX = Math.random();
			var rndY = Math.random();
			var sector = [];
			var condition = Math.random();
			var rndDir = Math.floor(Math.random() * 3) - 1;  // random integer from: -1, 0, 1

			if (condition <= 0.1)
			{
				sector = [rndDir, -1];
				var side = 'b';
			}
			else if (condition <= 0.35)
			{
				sector = [1, rndDir];
				var side = 'l';
			}
			else if (condition <= 0.6)
			{
				sector = [-1, rndDir];
				var side = 'r';
			}
			else if (condition <= 1)
			{
				sector = [rndDir, 1]
				var side = 't';
			}

			vec.createEnemy(vec.enemyTypes[Math.floor(condition * vec.enemyTypes.length)], sector, rndX, rndY, side);
		}

		vec.timers.bonus.elapsed += vec.timeStep;
		
		if (vec.timers.bonus.elapsed > vec.timers.bonus.timer)
		{
			var dif = vec.timers.bonus.elapsed - vec.timers.bonus.timer;
			vec.timers.bonus.elapsed = dif;

			var bonus = {};
			bonus.velocity = {x: 0, y: 13};
			bonus.id = vec.bonusesId.length;
			vec.bonusesId.push(bonus.id);
			bonus.width = 1.5;
			bonus.height = 1.5;
			bonus.alive = true;
			bonus.render = true;
			bonus.kill = false;
			bonus.x = Math.floor(Math.random() * (1 + 0.9 * vec.width - 0.1 * vec.width)) + Math.floor(0.1 * vec.width);
			bonus.y = - 2 * bonus.height * vec.factorY;
			bonus.type = vec.bonuses[Math.floor(Math.random() * vec.bonuses.length)];
			
			switch (bonus.type)
			{
				case 'shield':
					bonus.color = '#FFFA00';
					bonus.effect = function() {
						vec.player.shield.type = vec.colors[Math.floor(Math.random() * vec.colors.length)];
						vec.player.shield.health = vec.player.shield.max;
					};
					break;
				case 'firerate':
					bonus.color = '#00A6A0';
					bonus.effect = function() {

						if (!vec.player.fireMaxEvent.on)
						{
							vec.addEvent(vec.player, vec.player.maxFireRate, 'playerBasicVertical');
							vec.player.fireMaxEvent.on = true;
							vec.player.fireMaxEvent.index = vec.player.events.length - 1;
						}
						else
						{
							vec.player.fireMaxEvent.timeElapsed = 0;
						}
					};
					break;
				case 'firepower':
					bonus.color = '#BD006B';
					bonus.effect = function() {
						if (vec.firePowers.length)
						{
							var index = Math.floor(Math.random() * vec.firePowers.length);
							vec.addEvent(vec.player, vec.player.fireRate, vec.firePowers[index]);
							vec.firePowers.splice(index, 1);
						}
						if (vec.player.fireRate < 3 * vec.player.maxFireRate)
						{
							return;
						}
						else
						{
							vec.player.fireRate -= 0.05;
							for (var i = 0; i < vec.player.events.length; i++)
							{
								if ((vec.player.fireMaxEvent.index !== false) && (i !== vec.player.fireMaxEvent.index))
								{
									vec.player.events[i].condition = vec.player.fireRate;
								}
								else
								{
									vec.player.events[i].condition = vec.player.fireRate;
								}
							}
						}
					};
					break;
				case 'shipDestruction':
					bonus.color = '#C82FFF';
					bonus.effect = function() {
						vec.score += vec.enemies.length * 50;
						vec.enemies.length = 0;
						vec.enemyCount = 0;
					};
					break;
				case 'bulletDestruction':
					bonus.color = '#451EF6';
					bonus.effect = function() {
						vec.bullets.enemies.length = 0;
						vec.bullets.player.length = 0;
						vec.bullets.neutral.length = 0;
					};
					break;
				case 'changeDirection':
					bonus.color = '#19F74A';
					bonus.effect = function() {
						vec.reverse.time = vec.reverse.condition;
					};
			}

			bonus.update = function() {
				this.y += this.velocity.y * vec.factorY * vec.timeStep;
						
				var check = false;
				check = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY, vec.player.x, vec.player.y, vec.player.width * vec.factorX, vec.player.height * vec.factorY);
				if (check)
				{
					this.effect();
					vec.score += 200;
					this.kill = true;
					this.alive = false;
					this.render = false;
					for (var i = 0; i < vec.group.update.length; i++)
					{
						if (vec.group.update[i].type && vec.group.update[i].type === 'shield' && vec.group.update[i].id === this.id)
						{
							vec.group.update.splice(i, 1);
						}
					}
					for (var i = 0; i < vec.group.render.length; i++)
					{
						if (vec.group.render[i].type && vec.group.render[i].type === 'shield' && vec.group.render[i].id === this.id)
						{
							vec.group.render.splice(i, 1);
						}
					}
				}
			};

			bonus.draw = function() {
				var border = Math.floor(this.width * vec.factorX) / 10;
				vec.ctx.main.fillStyle = '#000000';
				vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
				vec.ctx.main.fillStyle = vec.shadeColor2(this.color, 0.5);
				vec.ctx.main.fillRect(this.x + border, this.y + border, Math.floor(this.width * vec.factorX - 2 * border), Math.floor(this.height * vec.factorY - 2 * border));
				vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.2);
				vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX * 0.35), Math.floor(this.height * vec.factorY * 0.35));
				vec.ctx.main.fillRect(this.x + Math.floor(this.width * vec.factorX - this.width * vec.factorX * 0.35), this.y, Math.floor(this.width * vec.factorX * 0.35), Math.floor(this.height * vec.factorY * 0.35));
				vec.ctx.main.fillRect(this.x, this.y + Math.floor(this.height * vec.factorY - this.height * vec.factorY * 0.35), Math.floor(this.width * vec.factorX * 0.35), Math.floor(this.height * vec.factorY * 0.35));
				vec.ctx.main.fillRect(this.x + Math.floor(this.width * vec.factorX - this.width * vec.factorX * 0.35), this.y + Math.floor(this.height * vec.factorY - this.height * vec.factorY * 0.35), Math.floor(this.width * vec.factorX * 0.35), Math.floor(this.height * vec.factorY * 0.35));
			};
			vec.group.update.push(bonus);
			vec.group.render.push(bonus);
		}
		
	};

	this.test = 0;

	this.shadeColor2 = function(color, percent) {   
		// thanks to Pimp Trizkit
		// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
		var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
		return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	}

	this.blendColors = function(c0, c1, p) {
		// thanks to Pimp Trizkit
		// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
		var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
		return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
	}

	this.createEnemy = function(type, sector, rndX, rndY, side) {
		var positions = [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]];
		var width = Math.floor(Math.random() * 3) + 1;
		var height = Math.floor(Math.random() * 3) + 1;
		var x, y;
		var rnd = Math.random();
		var amplitudeX = Math.floor(Math.random() * (1 + 8 - 2)) + 2;
		var amplitudeY = Math.floor(Math.random() * (1 + 8 - 2)) + 2;
		var step = {n: Math.floor(Math.random() * (1 + 3 - 1)) + 1, d: Math.floor(Math.random() * (1 + 3 - 1)) + 1};

		for (var i = 0; i < width * height; i++)
		{
			x = 0;
			y = 0;
			switch(side)
			{
				case 't':
					y = Math.floor(0 - 3 * vec.enemyBaseSize * vec.factorY);
					switch(sector[0])
					{
						case -1:
							x = Math.floor(vec.width - vec.enemyBaseSize * vec.factorX * 3 - rnd * (vec.width - vec.enemyBaseSize * vec.factorX * 3) * vec.spawnSpots / 2);
							break;
						case 0:
							x = Math.floor(rnd * (vec.width - vec.enemyBaseSize * vec.factorX * 3));
							break;
						case 1:
							x = Math.floor(rnd * vec.width * vec.spawnSpots / 2);
							break;
					}
					break;
				case 'l':
					x = Math.floor(0 - 3 * vec.enemyBaseSize * vec.factorX);
					switch(sector[1])
					{
						case -1:
							y = Math.floor(vec.height - vec.enemyBaseSize * vec.factorY * 3 - rnd * (vec.height - vec.enemyBaseSize * vec.factorY * 3) * vec.spawnSpots / 2);
							break;
						case 0:
							y = Math.floor(rnd * (vec.height - vec.enemyBaseSize * vec.factorY * 3));
							break;
						case 1:
							y = Math.floor(rnd * vec.height * vec.spawnSpots / 2);
							break;
					}
					break;
				case 'r':
					x = vec.width;
					switch(sector[1])
					{
						case -1:
							y = Math.floor(vec.height - vec.enemyBaseSize * vec.factorY * 3 - rnd * (vec.height - vec.enemyBaseSize * vec.factorY * 3) * vec.spawnSpots / 2);
							break;
						case 0:
							y = Math.floor(rnd * (vec.height - vec.enemyBaseSize * vec.factorY * 3));
							break;
						case 1:
							y = Math.floor(rnd * vec.height * vec.spawnSpots / 2);
							break;
					}
					break;
				case 'b':
					y = vec.height;
					switch(sector[0])
					{
						case -1:
							x = Math.floor(vec.width - vec.enemyBaseSize * vec.factorX * 3 - rnd * (vec.width - vec.enemyBaseSize * vec.factorX * 3) * vec.spawnSpots / 2);
							break;
						case 0:
							x = Math.floor(rnd * (vec.width - vec.enemyBaseSize * vec.factorX * 3));
							break;
						case 1:
							x = Math.floor(rnd * vec.width * vec.spawnSpots / 2);
							break;
					}
					break;
			}
			if (i === 0)
			{
				x += (vec.enemyBaseSize * vec.factorX) | 0;
				y += (vec.enemyBaseSize * vec.factorY) | 0;
			}
			else
			{
				var rndPosition = Math.floor(Math.random() * (positions.length));
				x += (positions[rndPosition][0] * vec.enemyBaseSize * vec.factorX) | 0;
				y += (positions[rndPosition][1] * vec.enemyBaseSize * vec.factorY) | 0;
				positions.splice(rndPosition, 1);
			}

			var enemy = vec.getFirstDead(vec.enemies);

 			if (!enemy)
			{
				enemy = new vec.Enemy(x, y, type, sector, rndX, rndY, true, amplitudeX, amplitudeY, step);
				vec.enemies.push(enemy);
			}
			else
			{
				vec.Enemy(x, y, type, sector, rndX, rndY, true, amplitudeX, amplitudeY, step, enemy);
			}
			vec.enemyCount++;
			if (i === 0)
			{
				var parent = enemy;
				parent.parent = true;
				parent.id = vec.test;
				parent.children = [];
				vec.test++;
			}
			else
			{
				parent.children.push(enemy);
				enemy.parent = parent.id;
				enemy.id = vec.test - 1;
			}
			enemy = null;
		}
		parent = null;
	};

	this.boxCollision = function(x1, y1, w1, h1, x2, y2, w2, h2) {
		if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && h1 + y1 > y2)
		{
			return true;
		}

		return false;
	};

	this.removeFromArray = function(arr, remove) {
		var cnt = 0;
		for (var i = 0; i < remove.length; i++)
		{
			if (remove[i] >= 0)
			{
				arr.splice(remove[i] - cnt, 1);
				cnt++;
			}
		}
	};

	this.Enemy = function(x, y, type, sector, rndX, rndY, alive, amplitudeX, amplitudeY, step, enemy) {
		if (enemy)
		{
			var that = enemy;
		}
		else
		{
			var that = this;
		}
		that.width = 1.3;
		that.height = 1.3;
		that.x = x;
		that.y = y;
		that.prevX = x;
		that.prevY = y;
		that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
		that.canonColor = vec.shadeColor2(that.color, 0.8);
		that.innerColor = vec.shadeColor2(that.color, 0.5);
		that.jetColor = vec.shadeColor2(that.color, 0.2);
		that.source = 'enemy';
		that.events = [];
		that.velocity = {};
		that.kill = false;
		that.alive = alive;
		that.render = alive;
		that.moveBol = true;
		that.sector = sector;
		that.parent = true;
		that.id = '';
		that.children = [];
		that.stopMax = 0.85;
		that.random = {x: rndX * that.stopMax, y: rndY * that.stopMax};
		that.damage = vec.player.damageEnemy;
		that.onScene = false;

		that.processEvents = function() {
			if (this.events && this.events.length)
			{
				for (var i = 0; i < this.events.length; i++)
				{
					this.events[i].timeElapsed += vec.timeStep;
					if (this.events[i].timeElapsed > this.events[i].condition)
					{
						var dt = this.events[i].timeElapsed - this.events[i].condition;
						this.events[i].timeElapsed = dt;
						this.events[i].handler();
					}
				}
			}
		};

		that.isOnScene = function() {
			var testNow = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY, 0, 0, vec.width, vec.height);
			
			if (testNow === true)
			{
				this.onScene = true;
			}
		};

		that.isLeavingCanvas = function() {
			var testPrev = vec.boxCollision(this.prevX, this.prevY, this.width * vec.factorX, this.height * vec.factorY, -vec.width / 2, -vec.height / 4, vec.width + vec.width / 2, vec.height + vec.height / 4);
			var testNow = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY, -vec.width / 2, -vec.height / 4, vec.width + vec.width / 2, vec.height + vec.height / 4);
			
			if ((testPrev === true) && (testNow === false))
			{
				this.kill = true;
				this.render = false;
				this.alive = false;
				vec.enemyCount--;

   				if (this.parent === true && this.children.length > 0)
				{
					this.children.forEach(function(elm) {
						elm.kill = true;
						elm.render = false;
						elm.alive = false;
						vec.enemyCount--;
					});
				}
			}
		};

		that.stop = function() {
			if (this.parent === true)
			{
				if (this.sector[0] < 0)
				{
					var x = (vec.width / 2 - this.random.x * (vec. width / 2 - this.width * 3 * vec.factorX)) | 0;
					if (this.x < x)
					{
						this.moveBol = false;
					}
				}
				else if (this.sector[0] > 0)
				{
					var x = (vec.width / 2 + this.random.x * (vec.width / 2 - this.width * 3 * vec.factorX)) | 0;
					if (this.x > x)
					{
						this.moveBol = false;
					}
				}
				if (this.sector[1] < 0)
				{
					var y = (vec.height / 2 - this.random.y * (vec.height / 2 - this.height * vec.factorY * 3)) | 0;
					if (this.y < y)
					{
						this.moveBol = false;
					}
				}
				else if (this.sector[1] > 0)
				{
					var y = (vec.height / 2 + this.random.y * (vec.height / 2 - this.height * vec.factorY * 3)) | 0;
					if (this.y > y)
					{
						this.moveBol = false;
					}
				}
				if (this.moveBol === false)
				{
					this.children.forEach(function(elm) {
						elm.moveBol = false;
					});
				}
			}
		};

		switch (type)
		{
			case 'straight':
				that.halfWidth = that.width / 2;
				that.halfHeight = that.height / 2;
				that.velocity.x = 10 * that.sector[0];
				that.velocity.y = 10 * that.sector[1];
				that.health = 50;
				that.fireRate = Math.random() + 0.2 + vec.decreaseFireRate;
				vec.addEvent(that, that.fireRate, 'enemyBasic');

				that.move = function(dt) {
					this.prevX = this.x;
					this.prevY = this.y;
					this.x += (vec.factorX * this.velocity.x * dt) | 0;
					this.y += (vec.factorY * this.velocity.y * dt) | 0;
				};
				that.update = function() {
					this.move(vec.timeStep);
					this.isLeavingCanvas();
					this.processEvents();
					this.collision();
				};
				break;
			case 'straightStop':
				that.halfWidth = that.width / 2;
				that.halfHeight = that.height / 2;
				that.velocity.x = 10 * that.sector[0];
				that.velocity.y = 10 * that.sector[1];
				that.health = 100;
				that.fireRate = Math.random() + 0.2 + vec.decreaseFireRate;
				vec.addEvent(that, that.fireRate, 'enemyBasic');

				that.move = function(dt) {
					this.prevX = this.x;
					this.prevY = this.y;
					this.x += (vec.factorX * this.velocity.x * dt) | 0;
					this.y += (vec.factorY * this.velocity.y * dt) | 0;
				};
				that.update = function() {
					if (this.moveBol)
					{
						this.stop();
					}
					if (this.moveBol)
					{
						this.move(vec.timeStep);
					}
					this.isLeavingCanvas();
					this.processEvents();
					this.collision();
				};
				break;
			case 'sin':
				that.halfWidth = that.width / 2;
				that.halfHeight = that.height / 2;
				that.velocity.x = 10 * that.sector[0];
				that.velocity.y = 10 * that.sector[1];
				that.angle = 0;
				that.step = step.n * Math.PI / step.d;
				that.amplitudeX = amplitudeX;
				that.amplitudeY = amplitudeY;
				that.distance = {x: 0, y: 0};
				that.start = {x: that.x, y: that.y};
				that.health = 50;
				that.fireRate = Math.random() + 0.2 + vec.decreaseFireRate;
				vec.addEvent(that, that.fireRate, 'enemyBasic');

				that.move = function(dt) 
				{
					this.prevX = this.x;
					this.prevY = this.y;
					this.distance.x += (vec.factorX * this.velocity.x * dt) | 0;
					this.distance.y += (vec.factorY * this.velocity.y * dt) | 0;
					this.x = (this.start.x + this.sector[1] * vec.factorX * this.amplitudeX * Math.sin(this.angle) + this.distance.x) | 0;
					this.y = (this.start.y - this.sector[0] * vec.factorY * this.amplitudeY * Math.sin(this.angle) + this.distance.y) | 0;
					this.angle += this.step * dt;
				};
				that.update = function() {
					this.move(vec.timeStep);
					this.isLeavingCanvas();
					this.processEvents();
					this.collision();
				};
				break;
			case 'sinStop':
				that.halfWidth = that.width / 2;
				that.halfHeight = that.height / 2;
				that.velocity.x = 10 * that.sector[0];
				that.velocity.y = 10 * that.sector[1];
				that.angle = 0;
				that.step = Math.PI;
				that.amplitudeX = amplitudeX;
				that.amplitudeY = amplitudeY;
				that.distance = {x: 0, y: 0};
				that.start = {x: that.x, y: that.y};
				that.health = 100;
				that.fireRate = Math.random() + 0.2 + vec.decreaseFireRate;
				that.stopMax = 0.85; // maximum where the enemy can get before stopping
				vec.addEvent(that, that.fireRate, 'enemyBasic');

				that.move = function(dt) {
					this.prevX = this.x;
					this.prevY = this.y;
					this.distance.x += (vec.factorX * this.velocity.x * dt) | 0;
					this.distance.y += (vec.factorY * this.velocity.y * dt) | 0;
					this.x = (this.start.x + this.sector[1] * vec.factorX * that.amplitudeX * Math.sin(this.angle) + this.distance.x) | 0;
					this.y = (this.start.y - this.sector[0] * vec.factorY * that.amplitudeY * Math.sin(this.angle) + this.distance.y) | 0;
					this.angle += this.step * dt;
				};

				that.update = function() {
					if (this.moveBol)
					{
						this.stop();
					}
					if (this.moveBol)
					{
						this.move(vec.timeStep);
					}
					this.isLeavingCanvas();
					this.processEvents();
					this.collision();
				};
				break;
		}

		this.collision = function() {
			
			if (!this.onScene)
			{
				this.isOnScene();
			}
			if (!this.onScene)
			{
				return;
			}
			
			var check = false;
			var remove = [];

			for (var i = 0; i < vec.bullets.player.length; i++)
			{
				if (vec.bullets.player[i] && vec.bullets.player[i].alive)
				{
					check = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY,
											 vec.bullets.player[i].x, vec.bullets.player[i].y, vec.bullets.player[i].width * vec.factorX, vec.bullets.player[i].height * vec.factorY);

					if (check)
					{
						check = false;
						this.health -= this.damage;
						if (this.health <= 0)
						{
							this.alive = false;
							this.render = false;
							this.kill = true;
							vec.score += 50;
							vec.enemyCount--;
						}
						remove.push(i);
					}
				}
			}

			if (remove && remove.length > 0)
			{
				vec.removeFromArray(vec.bullets.player, remove);
			}

			remove.length = 0;

 			for (var i = 0; i < vec.bullets.neutral.length; i++)
			{
				if (vec.bullets.neutral[i] && vec.bullets.neutral[i].alive)
				{
					check = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY,
											 vec.bullets.neutral[i].x, vec.bullets.neutral[i].y, vec.bullets.neutral[i].width * vec.factorX, vec.bullets.neutral[i].height * vec.factorY);

					if (check)
					{
						check = false;
						this.health -= this.damage;
						if (this.health <= 0)
						{
							this.alive = false;
							this.render = false;
							this.kill = true;
							vec.score += 50;
							vec.enemyCount--;
						}
						remove.push(i);
					}
				}
			}

			if (remove && remove.length > 0)
			{
				vec.removeFromArray(vec.bullets.neutral, remove);
			}
		};

		that.draw = function() {
			vec.ctx.main.fillStyle = this.color;
			vec.ctx.main.fillRect(that.x, that.y, that.width * vec.factorX, that.height * vec.factorY);
			vec.ctx.main.fillStyle = that.jetColor;
			
			vec.ctx.main.fillRect(that.x - 0.2 * vec.factorX,
								  that.y + that.height * vec.factorY * 0.2,
								  that.width * vec.factorX * 0.4,
								  that.height * vec.factorY - that.height * vec.factorY * 0.2 * 2);
			
			vec.ctx.main.fillRect(that.x + that.width * vec.factorX - 0.2 * vec.factorX, that.y + that.height * vec.factorY * 0.2, that.width * vec.factorX * 0.4, that.height * vec.factorY - that.height * vec.factorY * 0.2 * 2);
			
			vec.ctx.main.fillRect(that.x + that.width * vec.factorX * 0.2,
								  that.y - 0.2 * vec.factorY,
								  that.width * vec.factorX - that.width * vec.factorX * 0.2 * 2,
								  that.height * vec.factorY * 0.4);
			
			vec.ctx.main.fillRect(that.x + that.width * vec.factorX * 0.2,
								  that.y + that.height * vec.factorY - 0.2 * vec.factorY,
								  that.width * vec.factorX - that.width * vec.factorX * 0.2 * 2,
								  that.height * vec.factorY * 0.4);
			vec.ctx.main.fillStyle = this.innerColor;
			vec.ctx.main.fillRect(that.x + Math.floor(that.width * vec.factorX * 0.9), that.y + Math.floor(that.height * vec.factorY * 0.9), that.width - Math.floor(that.width * vec.factorX * 0.9), that.height - Math.floor(that.height * vec.factorY * 0.9));

		};
	};

	this.Bullet = function(type, owner, bullet) {
		if (bullet)
		{
			var that = bullet;
		}
		else
		{
			var that = this;
		}
		that.velocity = {};
		that.type = type;
		that.life = vec.bulletLife;

		switch(type)
		{
			case 'enemyBasic':
				that.width = 0.4;
				that.height = 0.8;
				that.velocity.x = 18 * owner.sector[0];
				that.velocity.y = 18 * owner.sector[1];
				that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				that.render = true;
				that.alive = true;
				that.kill = false;

				that.draw = function() {
					vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.8);
					vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
					vec.ctx.main.fillStyle = this.color;
					vec.ctx.main.fillRect(this.x + this.width * vec.factorX / 8, this.y + this.width * vec.factorX / 8, Math.floor(this.width * vec.factorX) - 2 * this.width * vec.factorX / 8, Math.floor(this.height * vec.factorY) - 2 * this.width * vec.factorX / 8);
				};
				that.move = function(dt) {
					this.x += (vec.dir * this.velocity.x * vec.factorX * dt) | 0;
					this.y += (vec.dir * this.velocity.y * vec.factorY * dt) | 0;
				};
				break;

			case 'playerBasicVertical':
				that.width = 0.4;
				that.height = 0.8;
				that.velocity.x = 0;
				that.velocity.y = 18 * owner.sector[1];
				that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				that.render = true;
				that.alive = true;
				that.kill = false;

				that.draw = function() {
					vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.8);
					vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
					vec.ctx.main.fillStyle = this.color;
					vec.ctx.main.fillRect(this.x + this.width * vec.factorX / 8, this.y + this.width * vec.factorX / 8, Math.floor(this.width * vec.factorX) - 2 * this.width * vec.factorX / 8, Math.floor(this.height * vec.factorY) - 2 * this.width * vec.factorX / 8);
				};
				that.move = function(dt) {
					this.x += (vec.dir * this.velocity.x * vec.factorX * dt) | 0;
					this.y += (vec.dir * this.velocity.y * vec.factorY * dt) | 0;
				};
				break;

			case 'playerBasicHorizontal':
				that.width = 0.4;
				that.height = 0.8;
				that.velocity.x = 18;
				that.velocity.y = 0;
				that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				that.render = true;
				that.alive = true;
				that.kill = false;

				that.draw = function() {
					vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.8);
					vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
					vec.ctx.main.fillStyle = this.color;
					vec.ctx.main.fillRect(this.x + this.width * vec.factorX / 8, this.y + this.width * vec.factorX / 8, Math.floor(this.width * vec.factorX) - 2 * this.width * vec.factorX / 8, Math.floor(this.height * vec.factorY) - 2 * this.width * vec.factorX / 8);
				};
				that.move = function(dt) {
					this.x += (vec.dir * this.velocity.x * vec.factorX * dt) | 0;
					this.y += (vec.dir * this.velocity.y * vec.factorY * dt) | 0;
				};
				break;

			case 'playerBasicDiagonalR':
				that.width = 0.4;
				that.height = 0.8;
				that.velocity.x = 18;
				that.velocity.y = 18;
				that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				that.render = true;
				that.alive = true;
				that.kill = false;

				that.draw = function() {
					vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.8);
					vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
					vec.ctx.main.fillStyle = this.color;
					vec.ctx.main.fillRect(this.x + this.width * vec.factorX / 8, this.y + this.width * vec.factorX / 8, Math.floor(this.width * vec.factorX) - 2 * this.width * vec.factorX / 8, Math.floor(this.height * vec.factorY) - 2 * this.width * vec.factorX / 8);
				};
				that.move = function(dt) {
					this.x += (vec.dir * this.velocity.x * vec.factorX * dt) | 0;
					this.y += (vec.dir * this.velocity.y * vec.factorY * dt) | 0;
				};
				break;

			case 'playerBasicDiagonalL':
				that.width = 0.4;
				that.height = 0.8;
				that.velocity.x = 18;
				that.velocity.y = -18;
				that.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				that.render = true;
				that.alive = true;
				that.kill = false;

				that.draw = function() {
					vec.ctx.main.fillStyle = vec.shadeColor2(this.color, -0.8);
					vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
					vec.ctx.main.fillStyle = this.color;
					vec.ctx.main.fillRect(this.x + this.width * vec.factorX / 8, this.y + this.width * vec.factorX / 8, Math.floor(this.width * vec.factorX) - 2 * this.width * vec.factorX / 8, Math.floor(this.height * vec.factorY) - 2 * this.width * vec.factorX / 8);
				};
				that.move = function(dt) {
					this.x += (vec.dir * this.velocity.x * vec.factorX * dt) | 0;
					this.y += (vec.dir * this.velocity.y * vec.factorY * dt) | 0;
				};
				break;

			default:
				that.x = false;
				that.y = false;
				that.width = 0;
				that.height = 0;
				that.velocity.x = 0;
				that.velocity.y = 0;
				that.colors = [];
				that.color = '';
				that.render = false;
				that.alive = false;
				that.kill = false;
				that.health = 0;

				that.draw = function() {
					return false;
				};
				that.move = function() {
					return false;
				};
		}
		
		that.update = function() {
			this.move(vec.timeStep);
		};

		if (owner)
		{
			var pp = [owner.x + (owner.halfWidth * vec.factorX), owner.y + (owner.halfHeight * vec.factorY)];
			that.x = (pp[0] + vec.factorX * (vec.dir * owner.sector[0] * owner.halfWidth + that.width * (vec.dir * owner.sector[0] - 1) / 2)) | 0;
			that.y = (pp[1] + vec.factorY * (vec.dir * owner.sector[1] * owner.halfHeight + that.height * (vec.dir * owner.sector[1] - 1) / 2)) | 0;
		}

		if (owner.source === 'player')
		{
			vec.bullets.player.push(that);
		}
		else if (owner.source === 'enemy')
		{
			vec.bullets.enemies.push(that);
		}
	};

	for (var i = 0; i < 30; i++)
	{
		this.bullets.pool.push(new this.Bullet(false, ''));
	}
	
	this.stage = {
		bg: document.getElementById('bg'),  // background canvas (water, ground, stars, ...)
		main: document.getElementById('main'),  // main canvas (player, enemies, bonuses, ...)
		fg: document.getElementById('fg')  // foreground canvas (clouds, dust, ...)
	};
	
	this.setCanvas = function(o, p, w, h) {
		o.width = w;
		o.height = h;
		o.style.position = 'absolute';
		o.style.top = 0;
		o.style.left = 0;
		
		this.ctx[p] = o.getContext('2d');
	};

	// prepare canvas layers: set width, height, position
	for (var prop in vec.stage)
	{
		if (vec.stage.hasOwnProperty(prop))
		{
				vec.setCanvas(vec.stage[prop], prop, vec.width, vec.height);
		}
	}

	this.addEvent = function(elm, condition, type) {
		var event = {
			timeElapsed: 0,
			condition: condition,
			type: type,
			handler: function() {
				var bullet = vec.getFirstDead(vec.bullets.pool);

				if (!bullet)
				{
					bullet = new vec.Bullet(this.type, elm);
					vec.bullets.pool.push(bullet);
				}
				else
				{
					vec.Bullet(this.type, elm, bullet);
				}
			}
		};
		elm.events.push(event);
	};

	this.circleXboxCollision = function(x1, y1, r, x2, y2, w, h) {
		// thanks to markE
		// http://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle-in-html5-canvas
		var distX = Math.abs(x1 - x2 - w / 2);
		var distY = Math.abs(y1 - y2 - h / 2);

		if (distX > (w / 2 + r)) {
			return false;
		}
		if (distY > (h / 2 + r)) {
			return false;
		}

		if (distX <= (w / 2)) {
			return true;
		}
		if (distY <= (h / 2)) {
			return true;
		}

		var dx = distX - w / 2;
		var dy = distY - h / 2;
		return (dx * dx + dy * dy <= (r * r));
	};

	this.player.init = function() {
		this.width = 1.5;  // [game unit]
		this.height = 1.5;  // [game unit]
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;
		this.x = Math.floor(vec.halfWidth - this.halfWidth * vec.factorX);  // [scale unit]
		this.y = Math.floor(3 * vec.height / 4 - this.halfHeight * vec.factorY); // [scale unit]
		this.velocity = {x: 15, y: 15};  // [px / s / vec.factor]
		this.health = vec.maxHealth; // [points]
		this.kill = false;
		this.alive = true;
		this.render = true;
		this.controls = {37: false, 38: false, 39: false, 40: false};
		this.fireRate = 0.5; // [seconds / bullet]
		this.maxFireRate = 0.05;
		this.fireMaxStart = false;
		this.fireMax = false;
		this.sector = [0, -1];
		this.events = [];
		this.source = 'player';
		this.shield = {};
		this.shield.type = '';
		this.shield.outerRadius = Math.floor(this.width * vec.factorX * 1.5);
		this.shield.innerRadius = Math.floor(this.width * vec.factorX * 1.3);
		this.shield.health = 0;
		this.shield.max = 100;
		this.shield.progress = 0;
		this.damage = 10;
		this.damageEnemy = 20;
		this.condition = 10;
		this.timeElapsed = 0;
		this.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
		this.fireMaxEvent = {on: false, condition: 2, timeElapsed: 0, finished: false, index: false};

		this.move = function(dt) {
			if (this.controls[37])
			{
				this.x -= Math.floor(this.velocity.x * vec.factorX * dt);
			}
			else if (this.controls[39])
			{
				this.x += Math.floor(this.velocity.x * vec.factorX * dt);
			}
			if (this.controls[38])
			{
				this.y -= Math.floor(this.velocity.y * vec.factorY * dt);
			}
			else if (this.controls[40])
			{
				this.y += Math.floor(this.velocity.y * vec.factorY * dt);
			}
		};

		this.keepInBounds = function() {
			if (this.x + this.width * vec.factorX > vec.width)
			{
				this.x = vec.width - this.width * vec.factorX;
			}
			else if (this.x < 0)
			{
				this.x = 0;
			}
			
			if (this.y + this.height * vec.factorY > vec.height)
			{
				this.y = vec.height - this.height * vec.factorY;
			}
			else if (this.y < 0)
			{
				this.y = 0;
			}
		};

		this.damagePlayer = function(dmg, type) {
			if (this.color === type)
			{	
				vec.score += 20;
				this.health += dmg;
				if (this.health > vec.maxHealth)
				{
					this.health = vec.maxHealth;
				}
				return;
			}

			if (this.shield.health > 0)
			{
				if (this.shield.type !== type)
				{
					if (dmg <= this.shield.health)
					{
						this.shield.health -= dmg;
					}
					else
					{
						var dif = dmg - this.shield.health;
						this.shield.health = 0;
						this.health -= dif;
					}
				}
				else
				{
					vec.score += 20;
					this.shield.health += dmg;
					if (this.shield.health > this.shield.max)
					{
						this.shield.health = this.shield.max;
					}
					return;
				}
			}
			else
			{
				this.health -= dmg;
			}
		};

		this.draw = function() {
			if (this.shield.health > 0)
			{
				vec.ctx.main.fillStyle = vec.hex2rgba(vec.shadeColor2(this.shield.type, -0.2), this.shield.progress);
				vec.ctx.main.beginPath();
				vec.ctx.main.arc(this.x + Math.floor(this.width * vec.factorX / 2), this.y + Math.floor(this.height * vec.factorY / 2), this.shield.outerRadius, 0, 2 * Math.PI, false);
				vec.ctx.main.fill();
				vec.ctx.main.fillStyle = vec.shadeColor2(this.shield.type, 0.5);
				vec.ctx.main.beginPath();
				vec.ctx.main.arc(this.x + Math.floor(this.width * vec.factorX / 2), this.y + Math.floor(this.height * vec.factorY / 2), this.shield.innerRadius, 0, 2 * Math.PI, false);
				vec.ctx.main.fill();
			}
			vec.ctx.main.fillStyle = this.color;
			vec.ctx.main.fillRect(this.x, this.y, Math.floor(this.width * vec.factorX), Math.floor(this.height * vec.factorY));
			vec.ctx.main.fillStyle = vec.shadeColor2(this.color, 0.3);
			var border = Math.floor(this.width * vec.factorX / 10);
			vec.ctx.main.fillRect(this.x + border, this.y + border, Math.floor(this.width * vec.factorX - 2 * border), Math.floor(this.height * vec.factorY - 2 * border));
		};
		
		this.processEvents = function() {
			if (this.events && this.events.length)
			{
				for (var i = 0; i < this.events.length; i++)
				{
					this.events[i].timeElapsed += vec.timeStep;
					if (this.events[i].timeElapsed > this.events[i].condition)
					{
						var dt = this.events[i].timeElapsed - this.events[i].condition;
						this.events[i].timeElapsed = dt;
						this.events[i].handler();
					}
				}
			}
		};

		this.updateShieldProgress = function() {
			this.shield.progress = this.shield.health / this.shield.max;
		};

		this.collision = function() {
			var check = false;
			var remove = [];

  			for (var i = 0; i < vec.bullets.enemies.length; i++)
			{
				if (vec.bullets.enemies[i].alive)
				{
					if (this.shield.health > 0)
					{
						check = vec.circleXboxCollision(this.x + Math.floor(this.width * vec.factorX / 2), this.y + Math.floor(this.height * vec.factorY / 2), this.shield.innerRadius,
											 vec.bullets.enemies[i].x, vec.bullets.enemies[i].y, vec.bullets.enemies[i].width * vec.factorX, vec.bullets.enemies[i].height * vec.factorY);;
					}
					else
					{
						check = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY,
												 vec.bullets.enemies[i].x, vec.bullets.enemies[i].y, vec.bullets.enemies[i].width * vec.factorX, vec.bullets.enemies[i].height * vec.factorY);
					}

					if (check)
					{
						check = false;
						vec.bullets.enemies[i].kill = true;
						vec.bullets.enemies[i].render = false;
						vec.bullets.enemies[i].alive = false;
						remove.push(i);

						this.damagePlayer(this.damage, vec.bullets.enemies[i].color);

						if (this.health <= 0)
						{
							vec.gameOver = true;
							this.health = 0;
						}
					}
				}
			}

				if (remove && remove.length > 0)
				{
					vec.removeFromArray(vec.bullets.enemies, remove);
				}

				remove.length = 0;

			for (var i = 0; i < vec.bullets.neutral.length; i++)
			{
				if (vec.bullets.neutral[i].alive)
				{
					if (this.shield.health > 0)
					{
						check = vec.circleXboxCollision(this.x + Math.floor(this.width * vec.factorX / 2), this.y + Math.floor(this.height * vec.factorY / 2), this.shield.innerRadius,
											 vec.bullets.neutral[i].x, vec.bullets.neutral[i].y, vec.bullets.neutral[i].width * vec.factorX, vec.bullets.neutral[i].height * vec.factorY);;
					}
					else
					{
						check = vec.boxCollision(this.x, this.y, this.width * vec.factorX, this.height * vec.factorY,
												 vec.bullets.neutral[i].x, vec.bullets.neutral[i].y, vec.bullets.neutral[i].width * vec.factorX, vec.bullets.neutral[i].height * vec.factorY);
					}

					if (check)
					{
						check = false;
						vec.bullets.neutral[i].kill = true;
						vec.bullets.neutral[i].render = false;
						vec.bullets.neutral[i].alive = false;
						remove.push(i);

						this.damagePlayer(this.damage, vec.bullets.neutral[i].color);

 						if (this.health <= 0)
						{
							vec.gameOver = true;
							this.health = 0;
						} 
					}
				}
			}

			if (remove && remove.length > 0)
			{
				vec.removeFromArray(vec.bullets.neutral, remove);
			}
		};

		this.updateEvents = function() {

			if (this.fireMaxEvent.on)
			{
				this.fireMaxEvent.timeElapsed += vec.timeStep;
				if (this.fireMaxEvent.timeElapsed > this.fireMaxEvent.condition)
				{
					this.fireMaxEvent.on = false;
					this.fireMaxEvent.timeElapsed = 0;
					this.fireMaxEvent.finished = true;
				}
				if (this.fireMaxEvent.finished)
				{
					this.fireMaxEvent.finished = false;
					this.events.splice(this.fireMaxEvent.index, 1);
					this.fireMaxEvent.index = false;
				}
			}
		};

		this.changeColor = function() {
			this.timeElapsed += vec.timeStep;
			
			if (this.timeElapsed > this.condition)
			{
				this.color = vec.colors[Math.floor(Math.random() * vec.colors.length)];
				var dif = this.timeElapsed - this.condition;
				this.timeElapsed = dif;
			}
		};

		this.update = function() {
			this.move(vec.timeStep);
			this.keepInBounds();
			this.processEvents();
			this.collision();
			this.updateShieldProgress();
			this.updateEvents();
			this.changeColor();

			if (vec.gameOver)
			{
				this.alive = false;
				this.render = false;
				this.kill = true;
				vec.pause.active = true;
			}
		};
		
		vec.addEvent(this, this.fireRate, 'playerBasicVertical');
		
	};

	this.player.init();

	this.setNewPosition = function(elm) {
		elm.x = elm.x * this.scaleX;
		elm.y = elm.y * this.scaleY;
	};

	this.control = function(e) {
		if (e.type === 'keydown')
		{
			var bol = true;
		}
		else
		{
			var bol = false;
		}

		if (e.type === 'keydown')
		{
			if (vec.gameOver && e.keyCode == 32)
			{
				vec.init();
			}
			if (vec.introduction && e.keyCode == 32)
			{
				vec.introduction = false;
				vec.div3.parentNode.removeChild(vec.div3);
				vec.div2.parentNode.removeChild(vec.div2);
				vec.div2 = null;
				vec.div3 = null;
			}
		}
		
		switch(e.keyCode)
		{
			case 37:
				vec.player.controls[37] = bol;
				break;
			case 39:
				vec.player.controls[39] = bol;
				break;
			case 38:
				vec.player.controls[38] = bol;
				break;
			case 40:
				vec.player.controls[40] = bol;
				break;
			default:
				return;
		}
		
		e.preventDefault();
	};

	this.updateRatioAndFactorOnResize = function() {
		this.ratioX = this.width / this.baseWidth;
		this.ratioY = this.height / this.baseHeight;
		this.factorX = this.unit * this.ratioX;
		this.factorY = this.unit * this.ratioY;
	};

	this.updatePositionsOnResize = function() {
		if (this.group.update && this.group.update.length)
		{
			this.group.update.forEach(function(elm) {
				if (elm.constructor && elm.constructor === Array)
				{
					elm.forEach(function(elm) {
						vec.setNewPosition(elm);
					});
				}
				else
				{
					vec.setNewPosition(elm);
				}
			});
		}
	};
	
	this.updateGameSizeOnResize = function() {
		this.widthOld = this.width;
		this.heightOld = this.height;
		this.windowWidth = Math.floor(window.innerWidth);
		this.windowHeight = Math.floor(window.innerHeight);
		this.ratioW = this.windowWidth / this.baseWidth;
		this.ratioH = this.windowHeight / this.baseHeight;

		if (this.ratioW < this.ratioH)
		{
			this.width = Math.floor(this.windowWidth);
			this.height = this.width * this.baseHeight / this.baseWidth;
		}
		else
		{
			this.height = Math.floor(this.windowHeight);
			this.width = this.height * this.baseWidth / this.baseHeight;
		}
		
		this.div.style.width = this.width + 'px';
		this.div.style.height = this.height + 'px';
		this.halfWidth = this.width / 2;
		this.halfHeight = this.height / 2;
		this.scaleX = this.width / this.widthOld;
		this.scaleY = this.height / this.heightOld;
	};

	this.resize = function() {

		vec.updateGameSizeOnResize();
		vec.updateRatioAndFactorOnResize();
		vec.updatePositionsOnResize();

		// set new size to all canvases
		for (var key in vec.stage)
		{
			if (vec.stage.hasOwnProperty(key))
			{
				vec.stage[key].width = vec.width;
				vec.stage[key].height = vec.height;
			}
		}

		vec.render();
	};

	this.blur = function() {
		vec.player.controls = {37: false, 38: false, 39: false, 40: false};
		vec.pause.active = true;
		vec.pause.state = true;
		vec.pause.time = vec.lastTime ? vec.lastTime : 0;
	};

	this.focus = function() {
		vec.pause.active = false;
	};

	this.update = function() {
		if (this.group && this.group.update && this.group.update.length)
		{
			this.group.update.forEach(function(elm) {
				if (elm.length === undefined && elm.alive && elm.update)
				{
					elm.update();
				}
				else if (elm.length && elm.length > 0)
				{
					elm.forEach(function(elm) {
						if (elm.alive && elm.update)
						{
							elm.update();
						}
					})
				}
			});
		}
	};

	this.HUD = {};
	this.HUD.init = function() {
		this.alive = true;
		this.render = true;
		this.healthWidth = Math.floor( 2 * vec.width / 7);
		this.healthFill = 1;
		this.healthHeight = Math.floor(vec.height / 28);
		this.healthBorder = Math.floor(this.healthHeight / 10);
		this.scoreSize = Math.floor(vec.height / 35);
		this.healthSize = Math.floor(vec.height / 40);
		
		this.scoreText2;

		this.update = function() {
			this.healthFill = vec.player.health / vec.maxHealth;
		};

		this.draw = function() {
			vec.ctx.fg.font = 'bold ' + this.scoreSize + 'px Verdana';
			this.scoreText = vec.ctx.fg.measureText('SCORE');		
			this.scoreText2	= vec.ctx.fg.measureText(vec.score);
			vec.ctx.fg.fillStyle = '#ffffff';
			vec.ctx.fg.fillText('SCORE', vec.width - Math.floor(1.2 * this.scoreText.width), Math.floor(1.5 * this.scoreSize));
			vec.ctx.fg.fillText(vec.score, vec.width - Math.floor(this.scoreText.width / 5 + this.scoreText2.width), 3 * this.scoreSize);
			vec.ctx.fg.fillStyle = '#802426';
			vec.ctx.fg.font = 'bold ' + this.healthSize + 'px Verdana';
			this.healthText = vec.ctx.fg.measureText('HEALTH');
			vec.ctx.fg.fillText('HEALTH', vec.width - Math.floor(1.2 * this.healthWidth), vec.height - Math.floor(2.15 * this.healthHeight));
			vec.ctx.fg.strokeStyle = '#802426';
			vec.ctx.fg.lineWidth = this.healthBorder;
			vec.ctx.fg.strokeRect(vec.width - Math.floor(1.2 * this.healthWidth), vec.height - 2 * this.healthHeight, this.healthWidth, this.healthHeight);
			vec.ctx.fg.fillStyle = '#FD0006';
			vec.ctx.fg.fillRect(vec.width - Math.floor(1.2 * this.healthWidth) + Math.floor(this.healthBorder / 2), vec.height - 2 * this.healthHeight + Math.floor(this.healthBorder / 2), Math.floor(this.healthWidth * this.healthFill) - this.healthBorder, this.healthHeight - this.healthBorder);
		};
	};

	this.HUD.init();
	vec.group.update.push(this.HUD);
	vec.group.render.push(this.HUD);

	this.hex2rgba = function(hex, a){
		var r = parseInt(hex.slice(1,3), 16);
		var g = parseInt(hex.slice(3,5), 16);
		var b = parseInt(hex.slice(5,7), 16);
		return 'rgba('+r+', '+g+', '+b+', '+a+')';
	}

	this.bgRender = {};
	this.bgRender.init = function() {
		this.alive = true;
		this.render = true;
		this.path = [];
		this.path2 = [];
		this.path3 = [];
		this.path4 = [];
		this.path5 = [];
		this.path6 = [];
		this.path7 = [];
		this.velocity = {};
		this.velocity.y = 6;
		this.progress = 0;
		this.condition = 60;
		this.timeElapsed = 0;
		this.steps = 10;
		this.cloudPositions = [];
		this.cloudCount = 0;

		var y = 0;
		for (var i = 0; i < this.steps + 2; i++)
		{
			if (i > 0)
			{
				y += Math.floor(vec.height / this.steps);	
			}
			var x = Math.floor(Math.random() * (1 + vec.width - 3*vec.width / 7 - vec.width / 2)) + Math.floor(vec.width / 2);
			this.path.unshift([x, y]);
			this.path3.unshift([x + vec.width / 7, y]);
			this.path4.unshift([x + 2 * vec.width / 5, y]);
			this.path5.unshift([x - vec.width / 15, y]);
			x = Math.floor(Math.random() * (1 + vec.width / 4 - vec.width / 6)) + Math.floor(vec.width / 6);
			this.path2.unshift([x, y]);
			this.path6.unshift([x + vec.width / 15, y]);
			this.path7.unshift([x - vec.width / 20, y]);
		}

		this.drawClouds = function() {
			this.cloudPositions.forEach(function(elm) {
				vec.ctx.bg.fillStyle = elm[5];
				vec.ctx.bg.moveTo(elm[0], elm[1]);
				vec.ctx.bg.beginPath();
				vec.ctx.bg.arc(elm[0], elm[1], elm[2], 0, 2 * Math.PI, false);
				vec.ctx.bg.fill();
			});
		};

		this.createClouds = function(x, y) {

			var velX = Math.floor(Math.random() * (1 + 10 + 10)) - 10;
			var velY = Math.floor(Math.random() * (1 + 10 - 3)) + 3;
			var maxR = vec.width / 12;
			var minR = vec.width / 15;
			var r = Math.floor(Math.random() * (1 + maxR - minR)) + minR;
			var colors = ['#7F8FA7', '#98B2D8', '#EAEAEA', '#C0E1FF'];
			var color = colors[Math.floor(Math.random() * (colors.length))];
			this.cloudPositions.push([x, y, r, velX, velY, color]);
			this.cloudCount++;
			var dir;
			var max = Math.floor(Math.random() * (1 + 20 - 3)) + 3;
			var cnt = Math.floor(Math.random() * (1 + max - 3)) + 3;
			var cnt2 = 0;
			var X = x, Y = y;
			var r2 = r;

			for (var i = 0; i < cnt; i++)
			{
				if (cnt2 > 2)
				{
					X = this.cloudPositions[this.cloudPositions.length-1][0];
					Y = this.cloudPositions[this.cloudPositions.length-1][1];
					cnt2 = 0;
				}
				r = Math.floor(Math.random() * (1 + maxR - minR)) + minR;
				dir = [Math.floor(Math.random() * (3)) - 1, Math.floor(Math.random() * (3)) - 1];
				this.cloudPositions.push([X + dir[0] * r2, Y + dir[1] * r2, r, velX, velY, color]);
				cnt2++;
				this.cloudCount++;
				r2 = r;
			}
		};

		this.draw = function() {
			vec.ctx.bg.fillStyle = '#1B69DB'; //064AAD
			vec.ctx.bg.fillRect(0, 0, vec.width, vec.height);

			vec.ctx.bg.fillStyle = '#77C1FF';
			vec.ctx.bg.moveTo(0, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path6.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path6[i][0], this.path6[i][1]);
			}
			vec.ctx.bg.lineTo(0, vec.height);
			vec.ctx.bg.lineTo(0, 0);
			vec.ctx.bg.fill();			

			vec.ctx.bg.moveTo(vec.width, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path5.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path5[i][0], this.path5[i][1]);
			}
			vec.ctx.bg.lineTo(vec.width, vec.height);
			vec.ctx.bg.lineTo(vec.width, 0);
			vec.ctx.bg.fill();
			
			vec.ctx.bg.fillStyle = '#FDFF78';
			vec.ctx.bg.moveTo(0, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path2.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path2[i][0], this.path2[i][1]);
			}
			vec.ctx.bg.lineTo(0, vec.height);
			vec.ctx.bg.lineTo(0, 0);
			vec.ctx.bg.fill();
			

			vec.ctx.bg.moveTo(vec.width, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path[i][0], this.path[i][1]);
			}
			vec.ctx.bg.lineTo(vec.width, vec.height);
			vec.ctx.bg.lineTo(vec.width, 0);
			vec.ctx.bg.fill();

			vec.ctx.bg.fillStyle = '#FFD878';
			vec.ctx.bg.moveTo(0, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path7.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path7[i][0], this.path7[i][1]);
			}
			vec.ctx.bg.lineTo(0, vec.height);
			vec.ctx.bg.lineTo(0, 0);
			vec.ctx.bg.fill();			

			vec.ctx.bg.fillStyle = '#119E1B';
			vec.ctx.bg.moveTo(vec.width, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path3.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path3[i][0], this.path3[i][1]);
			}
			vec.ctx.bg.lineTo(vec.width, vec.height);
			vec.ctx.bg.lineTo(vec.width, 0);
			vec.ctx.bg.fill();

			vec.ctx.bg.fillStyle = '#727272';
			vec.ctx.bg.moveTo(vec.width, 0);
			vec.ctx.bg.beginPath();
			for (var i = this.path4.length - 1; i >= 0; i--)
			{
				vec.ctx.bg.lineTo(this.path4[i][0], this.path4[i][1]);
			}
			vec.ctx.bg.lineTo(vec.width, vec.height);
			vec.ctx.bg.lineTo(vec.width, 0);
			vec.ctx.bg.fill();

			this.drawClouds();

			vec.ctx.bg.fillStyle = 'rgba(224, 232, 244, 0.25)';
			vec.ctx.bg.fillRect(0, 0, vec.width, vec.height);

			vec.ctx.bg.fillStyle = vec.hex2rgba(vec.player.color, 0.25);
			vec.ctx.bg.fillRect(0, 0, vec.width, vec.height);			
		}
		this.update = function() {
			for (var i = 0; i < this.path2.length; i++)
			{
				this.path2[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path.length; i++)
			{
				this.path[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path3.length; i++)
			{
				this.path3[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path4.length; i++)
			{
				this.path4[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path5.length; i++)
			{
				this.path5[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path6.length; i++)
			{
				this.path6[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}
			for (var i = 0; i < this.path7.length; i++)
			{
				this.path7[i][1] += Math.floor(this.velocity.y * vec.factorY * vec.timeStep);
			}

			if (this.path[this.path.length-1][1] > - vec.height / 10)
			{
 			var y = - Math.floor(vec.height / 5);
			var x = Math.floor(Math.random() * (1 + vec.width - 3 * vec.width / 7 - vec.width / 2)) + Math.floor(vec.width / 2);
			this.path.push([x, y]);
			this.path3.push([x + vec.width / 7, y]);
			this.path4.push([x + 2 * vec.width / 5, y]);
			this.path5.push([x - vec.width / 15, y]);
			x = Math.floor(Math.random() * (1 + vec.width / 4 - vec.width / 6)) + Math.floor(vec.width / 6);
			this.path2.push([x, y]);
			this.path6.push([x + vec.width / 15, y]);
			this.path7.push([x - vec.width / 20, y]);
			}
			for (var i = 0; i < this.path.length; i++)
			{
				if (this.path[i][1] > vec.height + 2 * vec.height / 10)
				{
					this.path.splice(i, 1);
					this.path2.splice(i, 1);
					this.path3.splice(i, 1);
					this.path4.splice(i, 1);
				}
			}
			if (this.cloudCount < 20)
			{
				this.createClouds(Math.floor(Math.random() * (1 + vec.width + vec.width / 5)) - Math.floor(vec.width / 5), - Math.floor(vec.height / 5));
			}
			if (this.cloudCount > 0)
			{
				for (var j = 0; j < this.cloudPositions.length; j++)
				{
 					this.cloudPositions[j][0] += this.cloudPositions[j][3] * vec.factorX * vec.timeStep;
					this.cloudPositions[j][1] += this.cloudPositions[j][4] * vec.factorY * vec.timeStep;
					if ((this.cloudPositions[j][0] > vec.width + vec.width / 3) || (this.cloudPositions[j][0] < 0 - vec.width / 3) || (this.cloudPositions[j][1] > vec.height + vec.height / 3))
					{
						this.cloudPositions.splice(j, 1);
						this.cloudCount--;
					}
				}
			}
		};
	};

	this.bgRender.init();
	vec.group.render.push(this.bgRender);
	vec.group.update.push(this.bgRender);

	this.render = function() {
		for (var key in this.ctx)
		{
			if (this.ctx.hasOwnProperty(key))
			{
				this.ctx[key].clearRect(0, 0, this.width, this.height);
			}
		}
		
		if (this.group && this.group.render && this.group.render.length)
		{
			this.group.render.forEach(function(elm) {
				if (elm.length === undefined && elm.alive && elm.render)
				{
					elm.draw();
				}
				else if (elm.length && elm.length > 0)
				{
					elm.forEach(function(elm) {
						if (elm.alive && elm.render)
						{
							elm.draw();
						}
					})
				}
			});
		}
	};

 	for (var i = 0; i < 30; i++)
	{
		this.enemies.push(new this.Enemy(0, 0, 'straight', [0,1], 0.2, 0.2, false, 1, 1, 1));
	}

	this.store = false;
	this.storedScore = false;
	this.storeScore = function() {
		if(this.storageAvailable('localStorage') && !this.store)
		{
			var storage = window.localStorage;
			this.storedScore = storage.getItem('vecScore');
			if (!this.storedScore || this.score > this.storedScore)
			{
				storage.setItem('vecScore', vec.score);
			}
			
			this.store = true;
		}
	};

	this.storageAvailable = function(type) {
	// thanks to MDN
	// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
		try {
			var storage = window[type],
				x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		}
		catch(e) {
			return false;
		}
	}

	this.introduction = true;
	this.startScreen = function() {
		vec.ctx.fg.fillStyle = '#FFCD77';
		vec.ctx.fg.fillRect(0, 0, vec.width, vec.height);
		vec.ctx.fg.fillStyle = vec.shadeColor2('#FFCD77', 0.4);
		var fontSize = vec.height / 10;
		vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
		var text = vec.ctx.fg.measureText('BoxBox');
		vec.ctx.fg.fillText('BoxBox', vec.width / 2 - text.width / 2, fontSize);
		var text = 'Welcome strider! You have managed to hijack the enemy\'s newest ship but a huge army is all around you, how long will you manage to resist!?<br><br><h2>Controls</h2>Arrows: <b>LEFT</b>, <b>UP</b>, <b>RIGHT</b>, <b>DOWN</b>.<br><h3>Instructions</h3>Your ship changes modes with time, it\'s determined by the color of your ship - the effect is so strong that even the environment is affected and changes it\'s color tone according to your ship! Getting hit by a laser of the same color as your ship <b>regains your health</b> and increases your score while other lasers just damage you so be vary!<br>Make sure you <b>collect various bonuses</b> which float in the air around they provide you your only advantage in this last mission of yours!<br><i>For example a shield with a specific color completely protects you against lasers of the same type as the shield while it\'s getting damaged instead of you when hit by other lasers.</i><br><h3>GOOD LUCK!</h3><br><center><b>Press SPACE bar to START the game!</b></center>';
		vec.div3.innerHTML = text;
		vec.div3.style.fontSize = Math.floor(vec.height / 35) + 'px';
		vec.div3.style.color = vec.shadeColor2('#FFCD77', -0.4);
		vec.div3.style.width = Math.floor(vec.width - vec.width * 0.1) + 'px';
		vec.div3.style.height = Math.floor(vec.height - vec.height * 0.15) + 'px';
		vec.div3.style.position = 'relative';
		vec.div3.style.top = '12%';
		vec.div3.style.left = '50%';
		vec.div3.style['transform'] = 'translate(-50%)';
		vec.div3.style['OTransform'] = 'translate(-50%)';
		vec.div3.style['msTransform'] = 'translate(-50%)';
		vec.div3.style['MozTransform'] = 'translate(-50%)';
		vec.div3.style['WebkitTransform'] = 'translate(-50%)';
		vec.div2.style.width = vec.width + 'px';
		vec.div2.style.height = vec.height + 'px';
		vec.div2.style.position = 'fixed';
		vec.div2.style.left = '50%';
		vec.div2.style.top = '50%';
		vec.div2.style['transform'] = 'translate(-50%,-50%)';
		vec.div2.style['OTransform'] = 'translate(-50%,-50%)';
		vec.div2.style['msTransform'] = 'translate(-50%,-50%)';
		vec.div2.style['MozTransform'] = 'translate(-50%,-50%)';
		vec.div2.style['WebkitTransform'] = 'translate(-50%,-50%)';
	};

	this.div2 = document.createElement('div');
	this.div3 = document.createElement('div');
	this.div.appendChild(this.div2);
	this.div2.appendChild(this.div3);

	this.gameOverScreen = function() {
		var w = 3 * vec.width / 4;
		if (this.storedScore)
		{
			var h = 6 * vec.height / 13;
		}
		else
		{
			var h = 3 * vec.height / 8;
		}
		var x = vec.width / 2 - w / 2;
		var y = vec.height / 2 - h / 2;
		var fontSize = Math.floor(vec.height / 15);
		vec.ctx.fg.fillStyle = vec.player.color;
		vec.ctx.fg.fillRect(x, y, w, h);
		var border = w / 25;
		vec.ctx.fg.fillStyle = vec.shadeColor2(vec.player.color, -0.3);
		vec.ctx.fg.fillRect(x + border, y + border, w - 2 * border, h - 2 * border);
		vec.ctx.fg.fillStyle = vec.player.color;
		vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
		var text = vec.ctx.fg.measureText('Game Over');
		vec.ctx.fg.fillText('Game Over', x + w / 2 - text.width / 2, y + 1.2 * fontSize);
		if (this.storedScore)
		{
			fontSize = Math.floor(vec.height / 20);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Best Record');
			vec.ctx.fg.fillStyle = vec.shadeColor2(vec.player.color, 0.2);
			vec.ctx.fg.fillText('Best Record', x + w / 2 - text.width / 2, y + 3 * fontSize);
			fontSize = Math.floor(vec.height / 20);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText(this.storedScore);
			vec.ctx.fg.fillText(this.storedScore, x + w / 2 - text.width / 2, y + 4.1 * fontSize);
			vec.ctx.fg.fillStyle = vec.player.color;
			fontSize = Math.floor(vec.height / 20);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Your Score');
			vec.ctx.fg.fillText('Your Score', x + w / 2 - text.width / 2, y + 5.1 * fontSize);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText(vec.score);
			vec.ctx.fg.fillText(vec.score, x + w / 2 - text.width / 2, y + 6.15 * fontSize);
			fontSize = Math.floor(vec.height / 25);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Press SPACE bar to');
			vec.ctx.fg.fillStyle = vec.shadeColor2(vec.player.color, 0.8);
			vec.ctx.fg.fillText('Press SPACE bar to', x + w / 2 - text.width / 2, y + 9.5 * fontSize);
			fontSize = Math.floor(vec.height / 15);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Try Again!');
			vec.ctx.fg.fillText('Try Again!', x + w / 2 - text.width / 2, y + 6.5 * fontSize);
		}
		else
		{
			vec.ctx.fg.fillStyle = vec.shadeColor2(vec.player.color, 0.2);
			fontSize = Math.floor(vec.height / 20);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Your Score');
			vec.ctx.fg.fillText('Your Score', x + w / 2 - text.width / 2, y + 3 * fontSize);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText(vec.score);
			vec.ctx.fg.fillText(vec.score, x + w / 2 - text.width / 2, y + 4.2 * fontSize);
			fontSize = Math.floor(vec.height / 25);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Press SPACE bar to');
			vec.ctx.fg.fillStyle = vec.shadeColor2(vec.player.color, 0.8);
			vec.ctx.fg.fillText('Press SPACE bar to', x + w / 2 - text.width / 2, y + 7 * fontSize);
			fontSize = Math.floor(vec.height / 15);
			vec.ctx.fg.font = 'bold ' + fontSize + 'px Verdana';
			var text = vec.ctx.fg.measureText('Try Again!');
			vec.ctx.fg.fillText('Try Again!', x + w / 2 - text.width / 2, y + 5 * fontSize);			
		}

	};

	this.touchControlStart = function(e) {
		e.preventDefault();

		if (vec.gameOver)
		{
			vec.init();
			return;
		}
		if (vec.introduction)
		{
			vec.introduction = false;
			vec.div3.parentNode.removeChild(vec.div3);
			vec.div2.parentNode.removeChild(vec.div2);
			vec.div2 = null;
			vec.div3 = null;
			return;
		}

		if (e.touches[0].pageX > 2 * window.innerWidth / 3)
		{
			vec.player.controls['39'] = true;
		}
		else if (e.touches[0].pageX < window.innerWidth / 3)
		{
			vec.player.controls['37'] = true;
		}

		if (e.touches[0].pageY > 2 * window.innerHeight / 3)
		{
			vec.player.controls['40'] = true;
		}
		else if (e.touches[0].pageY < window.innerHeight / 3)
		{
			vec.player.controls['38'] = true;
		}
	};
	
	this.touchControlEnd = function(e) {
		e.preventDefault();

		vec.player.controls['37'] = false;
		vec.player.controls['39'] = false;
		vec.player.controls['40'] = false;
		vec.player.controls['38'] = false;
	};

};

vec.init();

window.addEventListener('keydown', vec.control, false);
window.addEventListener('keyup', vec.control, false);
window.addEventListener('resize', vec.resize, false);
window.addEventListener('blur', vec.blur, false);
window.addEventListener('focus', vec.focus, false);
window.addEventListener('touchstart', vec.touchControlStart, false);
window.addEventListener('touchend', vec.touchControlEnd, false);

vec.gameLoop = function(time) {
	// time
	if (time && !vec.pause.active)
	{
		if (vec.pause.state)
		{
			vec.lastTime = time / 1000 - vec.timeStep;
			vec.pause.state = false;
		}
		if (vec.lastTime !== null) {
			vec.timeStep = time / 1000 - vec.lastTime;
		}
		vec.lastTime = time / 1000;

		if (!vec.introduction)
		{
			if (!vec.gameOver)
			{
				vec.update();	
			}
			vec.render();
			if (vec.gameOver)
			{
				if (!vec.store)
				{
					vec.storeScore();
				}
				vec.gameOverScreen();
			}	
		}
		if (vec.introduction)
		{
			vec.startScreen();
		}
	}
	window.requestAnimationFrame(vec.gameLoop);
};

vec.gameLoop();