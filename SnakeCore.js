var run_thread = null;
var snake = null;//蛇的实例
var food = null;//食物的实例
var paint = null;//画笔
var cvs;//画布
var runing = false;//是否游戏中
var score;//显示分数的<p>
var snake_init = 3;//蛇的初始长度
var s_time = false; //防止手动操作时按键过快
var map;//地图数组

var ai = false;//是否是ai运行
var ai_speed = 15;//ai运行时的速度
var route;//ai蛇下一步该走的格子

var CONSTANT = new function()
{
	/*全局常量*/
	this.SIZE = 24;//格子尺寸
	this.R = this.SIZE/2;
	this.MAP_W = 13;//地图大小
	this.MAP_H = 13;
	this.BLANK = (this.MAP_W+1) * (this.MAP_H + 1);//空白
	this.MAXLEN = this.MAP_W * 	this.MAP_H;//蛇的最大长度
	this.SNAKEID = this.BLANK * 2;//蛇的标记
	this.LEFT = 0;
	this.UP = 1;
	this.RIGHT = 2;
	this.DOWN = 3;
	this.DIR = [[-1,0],[0,-1],[1,0],[0,1]];
}
window.onload = function () 
{
	var st = document.getElementById('stage');//画布初始化
	st.width = CONSTANT.SIZE * CONSTANT.MAP_W;
	st.height = CONSTANT.SIZE * CONSTANT.MAP_H;
	cvs = document.getElementById("stage");//画笔初始化
	paint = cvs.getContext("2d");
	score = document.getElementById('score');
	document.getElementById("container").style.width=(st.width+10)+"px";
}
function Position(x, y) //坐标结构体
{ 
	this.x = 0; 
	this.y = 0; 
	if (arguments.length >= 1) this.x = x; 
	if (arguments.length >= 2) this.y = y; 
} 
function Snake()
{
	this.pos;//蛇身数组，0为蛇头
	this.dir;//蛇下一步的方向，用于手动操作
	this.init = function()
	{
		this.dir = CONSTANT.RIGHT;
		this.pos = new Array();
		for(var i =0;i<snake_init;i++)
			this.pos.push(new Position());
	}
	this.move = function()
	{
		if(!runing)return;
		var x = this.pos[0].x;
		var y = this.pos[0].y;
		var tx=this.pos[this.pos.length-1].x;
		var ty=this.pos[this.pos.length-1].y;
		for(var i=this.pos.length-1;i>0;i--)//蛇数组挪动
		{
			this.pos[i].x=this.pos[i-1].x;
			this.pos[i].y=this.pos[i-1].y;
		}		
		if(ai)
		{
			this.pos[0].x=route.x;
			this.pos[0].y=route.y;
		}
		else
		{	
			this.pos[0].x+=CONSTANT.DIR[this.dir][0];
			this.pos[0].y+=CONSTANT.DIR[this.dir][1];
		}		
		if(this.pos[0].x<0||this.pos[0].y<0||this.pos[0].x>=CONSTANT.MAP_W||//头碰到地图边缘
			this.pos[0].y>=CONSTANT.MAP_H)
		{
			runing = false;
		}
		else if(map[this.pos[0].y][this.pos[0].x]>=CONSTANT.SNAKEID)//撞到身体
		{
			runing = false;
		}
		if(!runing){
			this.pos[0].x = x;
			this.pos[0].y = y;
			return;
		}
		ReMap(snake.pos,map);
		if(this.pos[0].x == food.pos.x && this.pos[0].y == food.pos.y)//吃到食物
		{
			this.pos.push(new Position(tx,ty));
			map[ty][tx] = CONSTANT.SNAKEID;
			food.create();
		}
		
	}
}
function Food()
{
	this.pos = new Position();//食物坐标
	this.create = function()
	{
		if(snake.pos.length >=CONSTANT.MAXLEN)return;
		var x;var y;var i;
		while(1)
		{
			x = parseInt(Math.random() * (CONSTANT.MAP_W)); 
			y = parseInt(Math.random() * (CONSTANT.MAP_H)); 
			if(map[y][x]<CONSTANT.SNAKEID){
				this.pos = new Position(x,y);
				break;
			}
		}
	}
}
document.onkeydown = function(ev)
{
	if(runing && s_time &&!ai)
	{
		var evt = window.event || ev;
		if(evt.keyCode>=37 && evt.keyCode <=40) 
		{
			var f = evt.keyCode - 37;
			if(Math.abs(f-snake.dir)!=2) 
			{
				snake.dir = f;
				s_time = false;
			}		
				
		}
	}
}
function ShowScore()
{
	score.innerHTML="长度：" + String(snake.pos.length);
}
function RenderMap()//画场景
{
	paint.clearRect(0,0,cvs.width,cvs.height);
	paint.fillStyle="#800080";
	Draw(food.pos);

	paint.fillStyle="#00DB00";
	Draw(snake.pos[0]);
	paint.fillStyle="#FFFACD";
	for(var i = 1;i < snake.pos.length - 1 ;i ++)
	{
		Draw(snake.pos[i]);
	}
	paint.fillStyle="#D9B300";
	Draw(snake.pos[snake.pos.length - 1]);	
}
function Draw(pos)
{
	paint.beginPath();
	paint.arc(
		(pos.x*CONSTANT.SIZE)+CONSTANT.R,
		(pos.y*CONSTANT.SIZE)+CONSTANT.R,CONSTANT.R, 0, 2*Math.PI, true);
	paint.fill();
	paint.stroke();
}
function ReMap(psnake,pmap)//刷新地图数组
{
	for(var i = 0;i < CONSTANT.MAP_H;i ++)
	{
		for (var j = 0; j < CONSTANT.MAP_W; j++)
		{
			pmap[i][j]=CONSTANT.BLANK;
		}
	}
	for(i=0;i<psnake.length;i++){
		pmap[psnake[i].y][psnake[i].x]=CONSTANT.SNAKEID;
	}
}
function BFS(bfood,bhead,bmap)
{
	var queue = new Array();
	var h=0,w=0;//队列头和尾
	var tx,ty;
	queue.push(bfood);
	var bflag = false;
	var smap = new Array();//标记
	for(var i=0;i<CONSTANT.MAP_H;i++){
		smap[i] = new Array();
		for(var j=0;j<CONSTANT.MAP_W;j++)
			smap[i][j] =0;
	}
	bmap[bfood.y][bfood.x] = 0;
	while(h<=w)
	{
		
		if(smap[queue[h].y][queue[h].x]==1){
			h++;
			continue;
		}
		smap[queue[h].y][queue[h].x] = 1;
		for(i=0;i<4;i++)
		{
			tx = queue[h].x + CONSTANT.DIR[i][0];
			ty = queue[h].y + CONSTANT.DIR[i][1];
			if(tx<0||ty<0||tx>=CONSTANT.MAP_W||ty>=CONSTANT.MAP_H)
				continue;
			if(ty==bhead.y && tx==bhead.x)
			{
				bflag = true;
			}
			if(bmap[ty][tx] < CONSTANT.SNAKEID){
				if( bmap[ty][tx] > bmap[queue[h].y][queue[h].x]+1 && 
					bmap[queue[h].y][queue[h].x]!=CONSTANT.SNAKEID)
				{
						bmap[ty][tx] = bmap[queue[h].y][queue[h].x]+1;
				}
				if(smap[ty][tx] == 0)
				{
					w++;
					queue.push(new Position(tx,ty));
				}

			}
		}
		h++;
	}	
	return bflag;
}
function GetMax(bhead,bmap)//蛇头周围最远的路
{
	var broute =  new Position(-1);
	var max = -1;
	for(var i=0;i<4;i++)
	{
		tx = bhead.x + CONSTANT.DIR[i][0];
		ty = bhead.y + CONSTANT.DIR[i][1];
		if(CheckPos(new Position(tx,ty),bmap)&&bmap[ty][tx]>max&&bmap[ty][tx]!=CONSTANT.BLANK)
		{
			max = bmap[ty][tx];
			broute = new Position(tx,ty);
		}

	}
	return broute;
}
function GetMin(bhead,bmap)//蛇头周围最近的路
{
	var broute = new Position(-1);
	var min = CONSTANT.SNAKEID;
	for(var i=0;i<4;i++)
	{
		tx = bhead.x + CONSTANT.DIR[i][0];
		ty = bhead.y + CONSTANT.DIR[i][1];
		if(CheckPos(new Position(tx,ty),bmap)&&bmap[ty][tx]<min&&bmap[ty][tx]!=CONSTANT.BLANK)
		{
			min = bmap[ty][tx];
			broute = new Position(tx,ty);
		}

	}
	return broute;	
}
//对象数组的拷贝
var objDeepCopy = function (source) {
    var sourceCopy = source instanceof Array ? [] : {};
    for (var item in source) {
        sourceCopy[item] = typeof source[item] === 'object' ? objDeepCopy(source[item]) : source[item];
    }
    return sourceCopy;
}
function CheckRoute(tmap)
{
	var pos = objDeepCopy(snake.pos); //复制蛇身数据，用于测试
	var p;
	var tx,ty;

	while(1)
	{
		p = GetMin(pos[0],tmap);
		if(p.x==-1||p.y==-1){
			break;
		}
		var x = pos[0].x;
		var y = pos[0].y;
		var tx=pos[pos.length-1].x;
		var ty=pos[pos.length-1].y;	
		for(var i=pos.length-1;i>0;i--)//蛇数组挪动
		{
			pos[i].x=pos[i-1].x;
			pos[i].y=pos[i-1].y;
		}			
		pos[0].x=p.x;
		pos[0].y=p.y;
		tmap[p.y][p.x] = CONSTANT.SNAKEID;//标记一下，表示走过了
		if(p.x == food.pos.x && p.y == food.pos.y){
			pos.push(new Position(tx,ty));	
			tmap[ty][tx] = CONSTANT.SNAKEID;		
			break;
		}
	}
	ReMap(pos,tmap);
	if(BFS(pos[pos.length-1],pos[0],tmap))//能吃到尾巴说明路线安全
	{
		return true;
	}
	return false;
} 
function outmap(bmap)//打印当前地图 ，debug用
{
	var str="    ";
	for(var i = 0;i < CONSTANT.MAP_W;i ++)
		str+= JZ(i);
	str+="\n";
	for(var i = 0;i < CONSTANT.MAP_H;i ++)
	{
		str+=JZ(i);
		for (var j = 0; j < CONSTANT.MAP_W; j++)
		{
			str +=JZ(bmap[i][j]);
		}
		str+= "\n";
	}
	//console.log(str);
}
function JZ(v)//打印当前地图 ，debug用
{
	if(v<10)
			return "   "+v;
	else if(v<100)
			return "  "+v;
	else
		return " "+v;
}
function AISearch()
{
	if(BFS(food.pos,snake.pos[0],map))//得到路线图
	{
		if(snake.pos.length+1==CONSTANT.MAXLEN)
		{
			route = GetMin(snake.pos[0],map);
			return;		
		}
		var tmap  = objDeepCopy(map);
		if(CheckRoute(tmap))//检查路线是否安全
		{
			//能吃到，路线也安全
			route = GetMin(snake.pos[0],map);
			return;
		}
	}
	//没法吃到食物或者路线不安全，那就朝尾巴跑
	ReMap(snake.pos,map);
	if(BFS(snake.pos[snake.pos.length-1],snake.pos[0],map))
	{	
		//能吃到尾巴
		route = GetMax(snake.pos[0],map);
		return;
	}
	//吃不到食物，也吃不到尾巴，那就随便走一步
	var tx,ty;
	for(var i=0;i<4;i++)
	{
		tx = snake.pos[0].x + CONSTANT.DIR[i][0];
		ty = snake.pos[0].y + CONSTANT.DIR[i][1];
		if(!CheckPos(new Position(tx,ty),map))
			continue;
		else
		{
			route = new Position(tx,ty);
			return;
		}
	}
	//随便走一步都没法走，那就真の随便走一步(走完就死)
	runing = true;
	route = new Position(tx,ty);
}
function CheckPos(pos,tmap)//检查点是否安全
{
	if(pos.x<0||pos.y<0||pos.x>=CONSTANT.MAP_W||pos.y>=CONSTANT.MAP_H){
		return false;
	}	
	if(tmap[pos.y][pos.x]>=CONSTANT.SNAKEID){
		return false;
	}
	return true;
}
function Run()
{
	if(snake.pos.length >=CONSTANT.MAXLEN)
		GameOver();
	ReMap(snake.pos,map);
	if(ai)
	{
		AISearch();
	}
	s_time = true;
	snake.move();
	RenderMap();
	ShowScore();
	if(!runing)
		GameOver();	
}
function MapInit()//初始化地图数组
{
	map = new Array();
	for(var i = 0;i < CONSTANT.MAP_H;i ++)
	{
		map[i] = new Array();
	}
}
function GameInit()
{
	clearInterval(run_thread);
	MapInit();
	snake = new Snake();
	snake.init();
	ReMap(snake.pos,map);
	food = new Food();
	food.create();
	runing = true;
	if(ai)
		speed = ai_speed;
	else
		speed = 66;
	run_thread = setInterval(Run, speed); 	

}
function StartGame() 
{
	ai = false;
	GameInit();
}
function StartAI() 
{
	ai = true;
	GameInit();
}
function GameOver()
{
	paint.fillStyle="#FF0000";
	paint.font="40px Arial";
	paint.fillText("游戏结束",0,35);
	runing = false;
	clearInterval(run_thread);
}