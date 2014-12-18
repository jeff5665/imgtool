var images = require("images");
var findit = require('findit');
var path=require('path');
var mkdirp=require('mkdirp');
var log4js = require('log4js');
var logger_errorFile,logger_errorDetail;
var hasError=false;

function initLogger(){
    var errorFilePath='logs/errorFile.log';
    var errorDetailPath='logs/errorDetail.log';

    mkdirp.sync(path.dirname(errorFilePath));
    mkdirp.sync(path.dirname(errorDetailPath));
    log4js.configure({
        appenders: [
            { type: 'file', filename: errorFilePath, category: 'errorFile' },
            { type: 'file', filename: errorDetailPath, category: 'errorDetail' }
        ]
    });
    logger_errorFile = log4js.getLogger('errorFile');
    logger_errorDetail = log4js.getLogger('errorDetail');
    logger_errorFile.setLevel('ERROR');
    logger_errorDetail.setLevel('ERROR');
}

initLogger();




var userConfig={
   format:".jpg|.png|.gif",//允许的后缀
   quality:50,//图片质量
   input:"input",//图片的输入文件夹， 会遍历内部的文件夹，然后在输出路径里创建
   output:[
       {
           w:276,//必填 图片宽
           h:182,//必填 图片高
           prefix:"",
           dir:"output"   //输出路径 必填
       },
   ]
};






var ImgDrawer={
    drawImg:function(src,config){
        var self=this;
        var save_name=config.dir+path.dirname(src).replace(/\\/g,'/').replace(userConfig.input,'')+'/'+config.prefix+path.basename(src);
        //mkdirp(path.dirname(save_name),function(err){
            mkdirp.sync(path.dirname(save_name));
            //if (err) { throw err; }
            try{
                var result=images(config.w,config.h).fill(255, 255, 255, 1);//最终的图片
                var img=images(src);//加载进来的图片
                var w=img.width();//加载的图片宽度
                var h=img.height();//加载的图片高度
                var result_point={//最终图片绘制时的坐标
                    x:0,
                    y:0
                };
                var target_w=0;//图片缩放后宽度
                var target_h=0;//图片缩放后高度

                if(w<=config.w&&h<=config.h){//图像比要求的小，无需缩放处理
                    result_point=self.calCenterPoint(w,h,config);
                    result.draw(img,result_point.x,result_point.y);
                }else{
                    if(self.isWidthDirection(w,h,config)){//基于宽度缩放
                        target_w=config.w;
                        target_h=parseInt(h*config.w/w);
                    }else{//基于高度缩放
                        target_w=(w*config.h/h);
                        target_h=config.h;
                    }

                    result_point=self.calCenterPoint(target_w,target_h,config);
                    result.draw(img.size(target_w,target_h),result_point.x,result_point.y);
                }
                result.save(save_name,{quality : config.quality });
            }catch (e){
                hasError=true;
                logger_errorDetail.error(save_name,e);
                logger_errorFile.error(save_name);
            }
        //});
        //mkpath.sync(path.dirname(save_name));
        //mkpath.sync(path.dirname(save_name));

    },
    /**
     * 计算中心位置
     * @param w
     * @param h
     * @returns {{x: number, y: number}}
     */
    calCenterPoint:function (w,h,config){
        var x=(config.w-w)/2;
        var y=(config.h-h)/2;
        return {
            x:x,
            y:y
        }
    },
    /**
     * 基于哪个方向缩放
     * @param w
     * @param h
     * @returns {boolean} true:基于宽度 false:基于高度
     */
    isWidthDirection:function(w,h,config){
        if((w/h)>config.scale){
            return true;
        }else{
            return false;
        }
    }
};


function init(){
    var finder=findit(userConfig.input);

    finder.on('file', function (absFileName, stat) {
        //var filename=path.basename(absFileName);
        var fileFormat=path.extname(absFileName);
        if(userConfig.format.indexOf(fileFormat)>=0){
            console.log(absFileName);
            userConfig.output.forEach(function(config){
                config.scale=config.w/config.h;
                config.quality=userConfig.quality;
                ImgDrawer.drawImg(absFileName,config);
            });
        }
    });

    finder.on('end', function () {
        if(hasError){
            console.log('hasError');
        }else{
            console.log('success');
        }
    })
}

init();




