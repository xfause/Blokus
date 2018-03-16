function ParticleFactory(direction, particleColor) {
	particle_config = {
		"alpha": {
			"start": 1,
			"end": 0
		},
		"scale": {
			"start": 0.1,
			"end": 0.01,
			"minimumScaleMultiplier": 1
		},
		"color": {
			"start": particleColor.toString(16),
			"end": "#FFFFFF"
		},
		"speed": {
			"start": 50,
			"end": 10,
			"minimumSpeedMultiplier": 1
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"maxSpeed": 0,
		"startRotation": {
			"min": -15,
			"max": 15
		},
		"noRotation": false,
		"rotationSpeed": {
			"min": 0,
			"max": 0
		},
		"lifetime": {
			"min": 0.5,
			"max": 1.5
		},
		"blendMode": "normal",
		"frequency": 0.001,
		"emitterLifetime": -1,
		"maxParticles": 500,
		"pos": {
			"x": 0,
			"y": 0
		},
		"addAtBack": false,
		"spawnType": "rect",
		"spawnRect": {
			"x": 0,
			"y": 0,
			"w": 3,
			"h": 3
		}
	}
    var emitter = null
    // Calculate the current time
    
	var elapsed = Date.now();

    var updateId;
    var update = function(){
	    updateId = requestAnimationFrame(update);
        var now = Date.now();
        if (emitter)
            emitter.update((now - elapsed) * 0.0025);
        
		elapsed = now;
    };

	// Create the new emitter and attach it to the stage
	var emitterContainer = new PIXI.Container();

	var emitter = new PIXI.particles.Emitter(
		emitterContainer,
		[PIXI.Texture.fromImage("/static/pixi/images/image.png")],
		particle_config
	);
	emitter.particleConstructor = PIXI.particles.PathParticle;
	
	update();

	return emitterContainer
}

function ProgressBarFactory(stPoint, edPoint, player_id, colorTheme){
	var graphics = new PIXI.Graphics();
    graphics.beginFill(colorTheme.board.progress_bar.accuracy[player_id], 1);
	graphics.drawRect(0, 0, 1, 1)
	var progressBar = new PIXI.Sprite(graphics.generateTexture());
    graphics.beginFill(colorTheme.board.progress_bar.additional, 1);
	graphics.drawRect(0, 0, 1, 1)
	var tempBar = new PIXI.Sprite(graphics.generateTexture());

	var startPoint = Point(stPoint.x * gCellSize, stPoint.y * gCellSize);
	var endPoint = Point(edPoint.x * gCellSize, edPoint.y * gCellSize);

    function distance(pointA, pointB){
        return Math.sqrt((pointA.x - pointB.x) * (pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y))
	}
	
	function formTime(time){
		minute = Math.floor(time / 60)
		seconds = (time % 60)
		if (seconds <= 9)
			seconds = "0" + seconds.toString()
		return minute + ":" + seconds
	}
    var angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)

	var progressBarContainer = new PIXI.Container();

    tempBar.x = progressBar.x = startPoint.x
	tempBar.y = progressBar.y = startPoint.y
	var length = distance(startPoint, endPoint);
	tempBar.scale.x = progressBar.scale.x = length;
    tempBar.scale.y = progressBar.scale.y = colorTheme.board.progress_bar.width;
	tempBar.rotation = progressBar.rotation = angle;

	progressBarContainer.addChild(progressBar)
	progressBarContainer.addChild(tempBar)
	progressBarContainer.progressBar = progressBar;

    progressBarContainer.extremity = ParticleFactory(
        progressBar.rotation,
        colorTheme.board.progress_bar.accuracy[player_id]
	);

	progressBarContainer.addChild(progressBarContainer.extremity);
	progressBarContainer.extremity.rotation = angle
	progressBarContainer.extremity.x = endPoint.x
	progressBarContainer.extremity.y = endPoint.y
	progressBarContainer.extremity.visible = false

	var progressBarText = new PIXI.Text(
		"",
		new PIXI.TextStyle({
            fontSize: 1
        })
	);  
	progressBarText.updText= function(text){
		//Todo,not such right, need fix
		progressBarText.setText(text);
		progressBarText.rotation = angle
		if (Math.PI * 0.5 < angle && angle < Math.PI * 1.5)
		{
			var unitX = (endPoint.x - startPoint.x) / length;
			var unitY = (endPoint.y - startPoint.y) / length;
			progressBarText.scale.x = -1;
			progressBarText.scale.y = -1;
			progressBarText.x = startPoint.x + unitX * progressBarText.width;
			progressBarText.y = startPoint.y + unitY * progressBarText.width;
		}
		else
		{
			progressBarText.x = startPoint.x;  
			progressBarText.y = startPoint.y;  
		}
	}
	progressBarText.updText('NaN/NaN');
	progressBarContainer.addChild(progressBarText);
	progressBarContainer.progressBarText = progressBarText;

	progressBarContainer.setActivate = function(active){
		this.extremity.visible = active;
	}
	//todo update set progress rate to set time
	progressBarContainer.setProgressRate = function(total_time_left, temp_time_left, total_time, temp_time){
		this.progressBarText.updText(
			formTime(total_time_left + temp_time_left) + " / " +
			formTime(temp_time) + "+" + formTime(total_time) 
		);
		var total_rate = total_time_left / (total_time + temp_time);
		var total_end = {
			x: startPoint.x + (endPoint.x - startPoint.x) * total_rate,
			y: startPoint.y + (endPoint.y - startPoint.y) * total_rate
		}
		this.progressBar.scale.x = distance(startPoint, total_end)

		var temp_rate = (total_time_left + temp_time_left) / (total_time + temp_time);
		var temp_end = {
			x: startPoint.x + (endPoint.x - startPoint.x) * temp_rate,
			y: startPoint.y + (endPoint.y - startPoint.y) * temp_rate 
		}
		tempBar.x = total_end.x
		tempBar.y = total_end.y
		tempBar.scale.x = distance(total_end, temp_end);

		this.extremity.x = temp_end.x
		this.extremity.y = temp_end.y
	}
    return progressBarContainer;
}

function PieceFactory(pieceId,
                      shape,
                      offset,
                      player_id,
                      colorTheme,
                      DragStartCallBack,
                      DragMoveCallBack,
                      DragEndCallBack) {
    function onDragStart(event) {
        this.data = event.data;
        this.anchorPoint = this.data.getLocalPosition(this);
        this.alpha = colorTheme.piece.onselect_alpha;
        this.dragging = true;
        DragStartCallBack(pieceId, this.State());
    }

    function onDragMove() {
        if (this.dragging) {
            var new_position = this.data.getLocalPosition(this.parent);
            this.x = new_position.x - this.anchorPoint.x;
            this.y = new_position.y - this.anchorPoint.y;
            this.x = Math.max(this.x, -offset.x)
            this.y = Math.max(this.y, -offset.y)
            this.x = Math.min(this.x, gWidth - offset.x - this.width)
            this.y = Math.min(this.y, gHeight - offset.y - this.height)

            DragMoveCallBack(pieceId, this.State());
        }
    }

    function onDragEnd() {
        this.alpha = colorTheme.piece.initial_alpha
        this.dragging = false;
        this.data = null;
        if (true)
            DragEndCallBack(
                pieceId, 
                this.State()
            );
    }

    function CellList_2_Polygon(cell_list, offset){
        var vertex_list = [new PIXI.Point(0, 0)];
        cell_list.forEach(function (cell) {
            [[0, 0], [0, 1], [1, 1], [1, 0], [0 ,0]].forEach(function (point) {
                vertex_list.push(
                    new PIXI.Point(
                        (cell[0] + point[0]) * gCellSize + offset.x,
                        (cell[1] + point[1]) * gCellSize + offset.y
                    )
                )
            })
            vertex_list.push(new PIXI.Point(0, 0));
        });

        return new PIXI.Polygon(vertex_list);
    }

    var pieces = new PIXI.Container();
    pieces.piece = []

    shape.forEach(function(cellList, state){
        var polygon = CellList_2_Polygon(cellList, new PIXI.Point());

        var graphics = new PIXI.Graphics();
        graphics.beginFill(colorTheme.piece.cell[player_id], 1);
        graphics.drawPolygon(polygon);
        // todo adhoc
        //graphics.lineStyle(0, 0xFFFFFF, 0);
        graphics.endFill();
        cellList.forEach(function (cells) {
            graphics.drawRect(
                cells.x * gCellSize,
                cells.y * gCellSize,
                gCellSize,
                gCellSize
            )
        });
        graphics.endFill();

        var piece = new PIXI.Sprite(graphics.generateTexture());
        //piece.hitArea = polygon;
        piece.shape = polygon;
        piece.cellList = cellList;
        piece.visible = false;

        pieces.piece.push(piece);
        pieces.addChild(piece);
    })

    pieces.alpha = colorTheme.piece.initial_alpha
    pieces.anchor = new PIXI.Point();
    pieces.interactive = true
    pieces.dropped = false
    pieces
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    pieces.SetState = function (state) {
        if (typeof(this.state) !== "undefined")
            this.piece[this.state].visible = false;
        this.state = state;
        this.piece[state].visible = true;
    };
    pieces.SetState(0);

    pieces.State = function() {
        return {
            state: this.state, 
            x: Math.floor(this.x / gCellSize + 0.5),
            y: Math.floor(this.y / gCellSize + 0.5),
        };
    }

    pieces.SetOwnership= function(rights){
        pieces.visible = rights
        if(!pieces.dropped)
            pieces.interactive = rights
    }

    pieces.DropDown = function(){
        pieces.dropped = true
        pieces.visible = true
        pieces.interactive = false
        pieces.alpha = colorTheme.piece.dropped_alpha
    }

    pieces.Flip = function(){
        var new_state = this.state ^ 1
        this.SetState(new_state);
    };
    pieces.Rotate = function(clock){
        var new_state = (this.state + ((this.state % 2) ^ clock ? 2 : 6)) % 8
        this.SetState(new_state);
    };

    return pieces;
}

function BoardFactory(app, mPlayerId, colorTheme, TryDropPiece, piecesCellList) {
    var placedGroup = new PIXI.display.Group(-1, false); 
    var boardGroup = new PIXI.display.Group(0, false);
    var pieceGroup = new PIXI.display.Group(1, false);
    var draggedGroup = new PIXI.display.Group(2, false);
    [placedGroup, boardGroup, pieceGroup, draggedGroup].forEach(function(value, index, array){
        app.stage.addChild(new PIXI.display.Layer(value));
    });

    var graphics = new PIXI.Graphics();

    graphics.lineColor = colorTheme.board.dividing_line
    graphics.lineWidth = colorTheme.board.dividing_line_width
    //Draw board line
    for (var i = 0; i <= 20; i++) {
        graphics.moveTo(i * gCellSize, 0);
        graphics.lineTo(i * gCellSize, 20 * gCellSize);
        graphics.moveTo(0, i * gCellSize);
        graphics.lineTo(gCellSize * 20, i * gCellSize);
    }
    var boardShape = new PIXI.Sprite(graphics.generateTexture());
    boardShape.parentGroup = boardGroup;

    var board = new PIXI.Container();
    board.addChild(boardShape);

    //TODO Adhoc
    board.x = 4  * gCellSize;
    board.y = 4  * gCellSize;

    current_piece_id = -1
    function DragStartCallBack (id, position) {
        current_piece_id = id;
        console.log(
            "Drag start" + id,
            Math.floor(position.x / gCellSize),
            Math.floor(position.y / gCellSize)
        );
    }
    function DragMoveCallBack(id, position) {
        console.log(
            "Drag move " + id,
            Math.floor(position.x / gCellSize),
            Math.floor(position.y / gCellSize)
        );
    }
    function DragEndCallBack(id, position) {
        data = {
            piece_id: id,
            position: position
        }
        TryDropPiece(data);
    }
    board.progressBars = []
    for (var player_id = 0; player_id < 4; player_id++) {
        progressBar = ProgressBarFactory(
            gProgressBarEndPointList[player_id * 2],
            gProgressBarEndPointList[player_id * 2 + 1],
            player_id,
            colorTheme
        )
        progressBar.parentGroup = boardGroup
        board.addChild(progressBar)
        progressBar.setProgressRate(1);
        board.progressBars.push(progressBar);
    }

    //Create piece
    var pieceLists = [];
    for(var playerId = 0; playerId < 4; playerId ++) {
        var pieceList = [];
        for (var pieceId = 0; pieceId <= 20; pieceId++) {
            var piece = PieceFactory(
                pieceId,
                piecesCellList[pieceId],
                new PIXI.Point(board.x, board.y),
                playerId,
                colorTheme,
                DragStartCallBack,
                DragMoveCallBack,
                DragEndCallBack
            );
            piece.parentGroup = pieceGroup;
            piece.x = gPiecesLocate[pieceId].x * gCellSize;
            piece.y = gPiecesLocate[pieceId].y * gCellSize;
            piece.SetState(gInitState[pieceId])
            if (playerId !== mPlayerId) 
                piece.SetOwnership(false)
            pieceList.push(piece);
            board.addChild(piece);
        }
        pieceLists.push(pieceList);
    }
    board.pieceLists = pieceLists;
    //Create piece Done

    board.loadState = function(state) {
        //update progressBar
        for (var playerId = 0; playerId < 4; playerId ++) {
            var currentProgressBar = this.progressBars[playerId];
            currentProgressBar.setActivate(playerId === state.battle_info.current_player);
            currentProgressBar.setProgressRate(
                state.players_info[playerId].accuracy_time_left, 
                state.players_info[playerId].additional_time_left, 
                state.battle_info.accuracy_time,
                state.battle_info.additional_time
            )
        }
        
        //TODO state.playerState;
        var _pieceLists = this.pieceLists;
        for (var playerId = 0; playerId < 4; playerId ++){
            for (var pieceId = 0; pieceId < 21; pieceId ++){
                _pieceLists[playerId][pieceId].SetOwnership(playerId === mPlayerId);
            }
        }
        state.board_info.history.forEach(function (piece) {
            var isCurrentPlayer = piece.player_id == mPlayerId;
            var currentPiece = _pieceLists[piece.player_id][piece.piece_id];

            currentPiece.DropDown();
            currentPiece.SetState(piece.position.state);
            currentPiece.x = piece.position.x * gCellSize;
            currentPiece.y = piece.position.y * gCellSize;

            currentPiece.parentGroup = placedGroup;
        });
    };
    board.update_player = function(playerId){
        mPlayerId = playerId
        for(var player_id = 0; player_id < 4; player_id++) {
            board.pieceLists[player_id].forEach(piece => {
                piece.SetOwnership(player_id === mPlayerId)
            })
        }
    };

    board.isPossiblePosition = function (pieceId, position) {
        if (pieceId > 20 || pieceId < 0)
            return false;
        var positionState = this.position;
        //if (this.cellList[mPlayerId][pieceId].)
        
    };

    window.addEventListener(
        "keydown", 
        function(event){
            if (current_piece_id === -1)    
                return
            if (event.key == "w" || event.key == "s")
                board.pieceLists[mPlayerId][current_piece_id].Flip();
            if (event.key == "a" || event.key == "d")
                board.pieceLists[mPlayerId][current_piece_id].Rotate(event.key == 'a');
        },
        false
    );

    return board;
}

function generateBoard(canvas, mPlayerId, boardData, colorTheme){
    gWidth = canvas.width;
    gHeight = canvas.height;

    var app = new PIXI.Application(
        gWidth, 
        gHeight, 
        {
            backgroundColor: colorTheme.backgroundColor, 
            view: canvas
        }
    );
    app.stage = new PIXI.display.Stage();

    gCellSize = Math.floor(Math.min(gWidth, gHeight) / 28)
    gBoardSize = gCellSize * 20;

    function TryDropPiece(){

    }

    var board = BoardFactory(app, mPlayerId, colorTheme, TryDropPiece, boardData)
    app.stage.addChild(board);

    return board;
}