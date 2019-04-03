/**
* モデル定義
*/
var MODEL_DEF = [];
// haruモデル
MODEL_DEF['Tia'] = {
    "name":"Tia",
    "model":"assets/haru/haru.moc",
    "textures":[
        "assets/haru/haru.1024/texture_00.png",
        "assets/haru/haru.1024/texture_01.png",
        "assets/haru/haru.1024/texture_02.png",
    ],
    "motion":"assets/haru/haru_idle_03.mtn"
};
// Canvasのサイズ指定
var CAN_WIDTH = 512;
var CAN_HEIGHT = 512;

// Canvas
var glCanvas1 = null;
var gl = null;
var waku = null;

/**
* ロード時にクラスを生成する
*/
window.onload = function(){
    // 引数はcanvasID, Model定義, 表示スケール(省略可)
    glCanvas1 = new Simple("glcanvas", MODEL_DEF['haru']);
    // リサイズ用の枠を真ん中寄せにし、リサイズ処理
    waku = document.getElementById("waku");
    waku.style.width = "60%";
    waku.style.margin = "0 auto 0 auto";
    glResize();
 }


// JavaScriptで発生したエラーを取得
window.onerror = function(msg, url, line, col, error) {
    var errmsg = "file:" + url + " line:" + line + " " + msg;
    console.log(errmsg);
}

/**
* 既存のSimpleを拡張したクラス
*/
var Simple = function(canvasid , modeldef, modelscale) {
    // optional
    if(modelscale == null) modelscale = 2.0;
    console.log("--> Simple()");

    /**
    * Live2Dモデルのインスタンス
    */
    this.live2DModel = null;

    /**
    * アニメーションを停止するためのID
    */
    this.requestID = null;

    /**
    * モデルのロードが完了したら true
    */
    this.loadLive2DCompleted = false;

    /**
    * モデルの初期化が完了したら true
    */
    this.initLive2DCompleted = false;

    /**
    * WebGL Image型オブジェクトの配列
    */
    this.loadedImages = [];

    this.motion = null;     // モーション
    this.motionMgr = null;  // モーションマネジャー
    /**
    * Live2D モデル設定。
    */
    this.modelDef = modeldef;
    /**
    * Live2DモデルOpenGL表示サイズ
    */
    this.modelscale = modelscale;

    // Live2Dの初期化
    Live2D.init();


    // canvasオブジェクトを取得
    this.canvas = document.getElementById(canvasid);
    this.canvas.width = CAN_WIDTH;
    this.canvas.height = CAN_HEIGHT;

    // コンテキストを失ったとき
    this.canvas.addEventListener("webglcontextlost", function(e) {
        console.log("context lost");
        this.loadLive2DCompleted = false;
        this.initLive2DCompleted = false;

        var cancelAnimationFrame =
            window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame;
        cancelAnimationFrame(requestID); //アニメーションを停止

        e.preventDefault();
    }, false);

    // コンテキストが復元されたとき
    this.canvas.addEventListener("webglcontextrestored" , function(e){
        console.log("webglcontext restored");
        this.initLoop(this.canvas);
    }, false);

    // Init and start Loop
    this.initLoop(this.canvas);
};


/**
* WebGLコンテキストを取得・初期化。
* Live2Dの初期化、描画ループを開始。
*/
Simple.prototype.initLoop = function(canvas/*HTML5 canvasオブジェクト*/)
{
    console.log("--> initLoop");

    //------------ WebGLの初期化 ------------

    // WebGLのコンテキストを取得する
    gl = this.getWebGLContext(canvas);
    if (!gl) {
        console.log("Failed to create WebGL context.");
        return;
    }

    // 描画エリアを白でクリア
    gl.clearColor( 0.0 , 0.0 , 0.0 , 0.0 );

    //------------ Live2Dの初期化 ------------
    // コールバック対策用
    var that = this;
    // mocファイルからLive2Dモデルのインスタンスを生成
    this.loadBytes(that.modelDef.model, function(buf){
        that.live2DModel = Live2DModelWebGL.loadModel(buf);
    });

    // テクスチャの読み込み
    var loadCount = 0;
    for(var i = 0; i < that.modelDef.textures.length; i++){
        (function ( tno ){// 即時関数で i の値を tno に固定する（onerror用)
            that.loadedImages[tno] = new Image();
            that.loadedImages[tno].src = that.modelDef.textures[tno];
            that.loadedImages[tno].onload = function(){
                if((++loadCount) == that.modelDef.textures.length) {
                    that.loadLive2DCompleted = true;//全て読み終わった
                }
            }
            that.loadedImages[tno].onerror = function() {
                console.log("Failed to load image : " + that.modelDef.textures[tno]);
            }
        })( i );
    }
    // モーションのロード
    that.loadBytes(that.modelDef.motion, function(buf){
        that.motion = new Live2DMotion.loadMotion(buf);
    });
    // モーションマネジャーのインスタンス化
    that.motionMgr = new L2DMotionManager();

    //------------ 描画ループ ------------

    (function tick() {
        that.draw(gl, that); // 1回分描画

        var requestAnimationFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame;
        that.requestID = requestAnimationFrame( tick , that.canvas );// 一定時間後に自身を呼び出す
    })();
};


Simple.prototype.draw = function(gl/*WebGLコンテキスト*/, that)
{
    // Canvasをクリアする
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Live2D初期化
    if( ! that.live2DModel || ! that.loadLive2DCompleted )
        return; //ロードが完了していないので何もしないで返る

    // ロード完了後に初回のみ初期化する
    if( ! that.initLive2DCompleted ){
        that.initLive2DCompleted = true;

        // 画像からWebGLテクスチャを生成し、モデルに登録
        for( var i = 0; i < that.loadedImages.length; i++ ){
            //Image型オブジェクトからテクスチャを生成
            var texName = that.createTexture(gl, that.loadedImages[i]);

            that.live2DModel.setTexture(i, texName); //モデルにテクスチャをセット
        }

        // テクスチャの元画像の参照をクリア
        that.loadedImages = null;

        // OpenGLのコンテキストをセット
        that.live2DModel.setGL(gl);

        // 表示位置を指定するための行列を定義する
        var s = 2.0 / that.live2DModel.getCanvasWidth(); //canvasの横幅を-1..1区間に収める
        var matrix4x4 = [
             s, 0, 0, 0,
             0,-s, 0, 0,
             0, 0, 1, 0,
            -1, 1, 0, 1
        ];
        that.live2DModel.setMatrix(matrix4x4);
    }

    // モーションが終了していたらモーションの再生
    if(that.motionMgr.isFinished()){
        that.motionMgr.startMotion(that.motion);
    }
    that.motionMgr.updateParam(that.live2DModel);

    // Live2Dモデルを更新して描画
    that.live2DModel.update(); // 現在のパラメータに合わせて頂点等を計算
    that.live2DModel.draw();    // 描画
};


/**
* WebGLのコンテキストを取得する
*/
Simple.prototype.getWebGLContext = function(canvas/*HTML5 canvasオブジェクト*/)
{
    var NAMES = [ "webgl" , "experimental-webgl" , "webkit-3d" , "moz-webgl"];

    var param = {
        alpha : true,
    };

    for( var i = 0; i < NAMES.length; i++ ){
        try{
            var ctx = canvas.getContext( NAMES[i], param );
            if( ctx ) return ctx;
        }
        catch(e){}
    }
    return null;
};


/**
* Image型オブジェクトからテクスチャを生成
*/
Simple.prototype.createTexture = function(gl/*WebGLコンテキスト*/, image/*WebGL Image*/)
{
    var texture = gl.createTexture(); //テクスチャオブジェクトを作成する
    if ( !texture ){
        console.log("Failed to generate gl texture name.");
        return -1;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);    //imageを上下反転
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D , texture );
    gl.texImage2D( gl.TEXTURE_2D , 0 , gl.RGBA , gl.RGBA , gl.UNSIGNED_BYTE , image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
};


/**
* ファイルをバイト配列としてロードする
*/
Simple.prototype.loadBytes = function(path , callback)
{
    var request = new XMLHttpRequest();
    request.open("GET", path , true);
    request.responseType = "arraybuffer";
    request.onload = function(){
        switch( request.status ){
        case 200:
            callback( request.response );
            break;
        default:
            console.log( "Failed to load (" + request.status + ") : " + path );
            break;
        }
    }

    request.send(null);
};

var queue = null;
var wait = 300;

window.addEventListener('resize', function(){
    // イベント発生時にキューをキャンセル
    clearTimeout(queue);
    // waitで指定したミリ秒後に所定の処理を実行
    // 経過前に再度イベントが発生した場合
    // キューをキャンセルして再カウント
    queue = setTimeout(function(){
        glResize();
    },wait);
},false);

// リサイズ処理
function glResize(){
    // 元の画像サイズを保持
    var orgWidth  = glCanvas1.canvas.width;
    var orgHeight = glCanvas1.canvas.height;
    // 変更する画像サイズを指定
    glCanvas1.canvas.width = waku.clientWidth;
    glCanvas1.canvas.height = orgHeight * (glCanvas1.canvas.width / orgWidth);
    // glでの表示サイズもCanvasに合わせる
    gl.viewport(0,0,glCanvas1.canvas.width, glCanvas1.canvas.height);
}