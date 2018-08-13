var nums;
var maxLife = 10;
var noiseScale = 200;
var	simulationSpeed = 0.5;
var fadeFrame = 0;

var padding_top = 100;
var padding_side = 100;
var inner_square = 800;

var particles = [];
var backgroundColor;
var color_from;
var color_to;

var afinn;
var mood = 0;
var normalized_mood = 0; //TODO get particle color to reflect normalized_mood

function preload() {
  afinn = loadJSON('sketches/afinn111.json');
}

function setup() {
	nums = 250;	
	backgroundColor = color(20, 20, 20);
	//normalized_mood = map(mood, -1, 1, 0, 255);
	color_from = color('pink');
	color_to = color('cyan');
	var canvas = createCanvas(window.innerWidth/2, window.innerHeight);
	canvas.parent('sketch-holder');
	height = window.innerHeight;
	width = window.innerWidth/2;
	background(backgroundColor);
	
	noStroke();
	smooth();
	
	padding_top = 0;
	padding_side = 0;
	
	for(var i = 0; i < nums; i++){
		var p = new Particle();
		p.pos.x = random(padding_side, width-padding_side);
		p.pos.y = padding_top;
		particles[i] = p;
	}
	
	background(color(0));
	fill(color(255));

  var txt = select('#txt');
  txt.input(typing);
	
  function typing() {
    var textinput = txt.value();
    var words = [];
	var sentences = textinput.split(/(?=[/:.?!"^_`\[\]])/gim);
	for (var k = 0; k < sentences.length; k++){
		words.push(sentences[k].split(/\s+/));
	}
    var scoredwords = [];
    var totalScore = 0;
	var negate = 1;
	for (var j = 0; j < words.length; j++){
		if ((findAll(words[j], "n't") + findAll(words[j], "not"))%2 == 1)
			negate = -1;
		for (var i = 0; i < words[j].length; i++) {
		  var word = words[j][i].toLowerCase();
		  if (afinn.hasOwnProperty(word)) {
			var score = afinn[word] * negate;
			totalScore += Number(score);
			scoredwords.unshift(" " + word + ": " + score);
		  }
		}
		negate = 1;
	}
	mood = totalScore / trueLength(words);
	var moodVal = "";
    var scorePar = select('#scoreP');
    scorePar.html('score: ' + totalScore + "\t");
    var comp = select('#comparativeP');
    comp.html('comparative: ' + mood + "\t");
    var wordlist = select('#wordlistP');
    wordlist.html(scoredwords);
	if (mood < -0.5){
		moodVal = '&#x1f622';
	}else if (mood < 0){
		moodVal = '&#x1f61e';
	}else if (mood == 0){
		moodVal = '&#x1f611';
	}else if (mood < 0.5){
		moodVal = '&#x1f60f';
	}else {
		moodVal = '&#x1f60a';
	}
	var moodPar = select('#moodP');
    moodPar.html(moodVal);
	//var wordlist = select('#sentenceCountP');
    //wordlist.html('sentences: ' + words.length);
  }
}

//find all incidences of given string
function findAll(x, val){
	var count = 0; 
	for (var i = 0; i < x.length; i++){
		if (x[i] == val || x[i].indexOf(val) > -1){
			count++;
		}
	}
	return count;
}

function trueLength(x){
	var count = 0;
	for (var i = 0; i < x.length; i++){
		for (var j = 0; j < x[i].length; j++){
			count++;
		}
	}
	return count;
}

// below is heavily influenced by https://www.openprocessing.org/sketch/524376
function draw(){
	simulationSpeed = map(mood, -5, 5, -1.5, 1.5);
	//color_to = color(normalized_mood, 0, 0);
	fadeFrame++;
	if(fadeFrame % 5 == 0){
		
		blendMode(DIFFERENCE);
		fill(5, 1, 1);
		rect(0,0,width,height);

		blendMode(LIGHTEST);
		//blendMode(DARKEST); //stuttering confetti look
		fill(backgroundColor);
		rect(0,0,width,height);
	}
	
	//blendMode(BLEND);
	
	for(var i = 0; i < nums; i++){
		var iterations = map(i,0,nums,5,1);
		var radius = map(i,0,nums,2,6);
		
		particles[i].move(iterations);
		particles[i].checkEdge();
		
		var alpha = 255;
		
		var particle_heading = particles[i].vel.heading()/PI;
		if(particle_heading < 0){
				particle_heading *= -1;
		}
		var particle_color = lerpColor(particles[i].color1, particles[i].color2, particle_heading);
		
		var fade_ratio;
		fade_ratio = min(particles[i].life * 5 / maxLife, 1);
		fade_ratio = min((maxLife - particles[i].life) * 5 / maxLife, fade_ratio);

		fill(red(particle_color), green(particle_color), blue(particle_color), alpha * fade_ratio);
		particles[i].display(radius);
	} 
}

function Particle(){
// member properties and initialization
	//normalized_mood = map(mood, -5, 5, 0, 255) 
	this.vel = createVector(0, 0);
	this.pos = createVector(random(0, width), random(0, height));
	this.life = random(0, maxLife);
	this.flip = int(random(0,2)) * 2 - 1;
	this.color1 = this.color2 = color('hotpink');
	
	if(int(random(3)) == 1){
		//this.color2 = color('cyan');
		this.color1 = color_from
		this.color2 = color_to;
	}
	
// member functions
	this.move = function(iterations){
		if((this.life -= 0.01666) < 0)
			this.respawnTop();
		while(iterations > 0){
			
			var transition = map(this.pos.x, padding_side, width-padding_side, 0, 1);
			var angle = noise(this.pos.x/noiseScale, this.pos.y/noiseScale)*transition*TWO_PI*noiseScale;
			//var transition = map(this.pos.y, height/5, height-padding_top, 0, 1, true);
			//var angle = HALF_PI;
			//angle += (noise(this.pos.x/noiseScale, this.pos.y/noiseScale)-0.5)*transition*TWO_PI*noiseScale/66;

			this.vel.x = cos(angle);
			this.vel.y = sin(angle);
			this.vel.mult(simulationSpeed);
			this.pos.add(this.vel);
			iterations--;
		}
	}

	this.checkEdge = function(){
		if(this.pos.x > width - padding_side
		|| this.pos.x < padding_side
		|| this.pos.y > height - padding_top
		|| this.pos.y < padding_top){
			this.respawnTop();
		}
	}
	
	this.respawn = function(){
		this.pos.x = random(0, width);
		this.pos.y = random(0, height);
		this.life = maxLife;
	}
	
	this.respawnTop = function() {
		this.pos.x = random(padding_side, width-padding_side);
		this.pos.y = padding_top;
		this.life = maxLife;
		//this.color1 = lerpColor(color('white'), color_from, (this.pos.x-padding_side)/inner_square);
		//this.color2 = lerpColor(color('white'), color_to, (this.pos.x-padding_side)/inner_square);
	}

	this.display = function(r){
		ellipse(this.pos.x, this.pos.y, r, r);
	}
}