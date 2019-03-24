let channels = [];
let collect = false;
let sampleRate = 256;
let stream = false;

let out = document.getElementById('output');

let history = [];

let Device = new Bluetooth.BCIDevice((samples) => {
    if(!collect) return;

    let electrode = [2,3,16,17].indexOf(samples.electrode);
    let data = samples.data; // 12 samples of data

    if(electrode in channels) {
        channels[electrode].push(...data);
    } else {
        channels[electrode] = [];
    }

    if(stream){
        let enoughData = true;
        for(let i = 0; i < 4; i++){
            if(typeof channels[i] === 'undefined' || channels[i].length < 512){
                enoughData = false;
            }
        }

        if(enoughData) {
            // Make them all the same length
            for(let i = 0; i<4; i++){
                channels[i] = channels[i].slice(0, 512);
            }

            // Classify
            let samples = bci.transpose(channels);
            let feature = bci.averageBandPowers(samples, 256, ['gamma', 'delta']);
            let classification = bci.ldaProject(ldaParams, feature);

            // Reset buffer
            channels = [];

            history.push(classification);

            if(history.length > 3){
                history.shift();

                let sum = 0;
                for(let i = 0; i < history.length; i++){
                    sum += history[i];
                }
                let avg = sum / history.length;

                if(avg > 0) {
                    out.innerHTML = "Active though (Score: " + avg.toFixed(2) + ")";
                    bulletTime = false;
                } else {
                    out.innerHTML = "Relaxed (Score: " + avg.toFixed(2) + ")";
                    bulletTime = true;
                }
            }
        }
    }
});

async function connect() {
    try {
        out.innerHTML = "Connecting...";
        await Device.connect();
        out.innerHTML = "Connected!";
    } catch (e) {
        out.innerHTML = "connect/load error";
    }
}

let classes = new Array(2);
let ldaParams;

function train(class_id) {
    out.innerHTML = 'Collecting data for class ' + class_id;
    collect = true;
    let runtime = 10000;
    setTimeout(function(){
        // We no longer need to collect
        collect = false;

        // Make all the channels the same length
        let lengths = channels.map(data => data.length);
        let new_length = Math.min(...lengths);
        let trimmed_channels = channels.map(samples => samples.slice(0, new_length));
        channels = [];

        // Transpose into array of samples
        let samples = bci.transpose(trimmed_channels);

        // Get features
        let features = bci.windowApply(samples, samples => {
            return bci.averageBandPowers(samples, sampleRate, ['gamma', 'delta']);
        }, 512, 256);

        // And we're done
        classes[class_id] = features;

        // See if we can train LDA
        // Yes this is if statement is ugly, sorry, writing quick code for hackathon
        if(classes[0] && classes[0].length > 0 && classes[1] && classes[1].length > 0) {
            ldaParams = bci.ldaLearn(...classes);
        }

        out.innerHTML = 'Collected features for class ' + class_id;
    }, runtime);

    function showProgress(time){
        let progress = Math.round(time / runtime * 100);
        console.log(progress);
        if(progress < 100){
            document.getElementById("progress").innerHTML = progress + " %";
            setTimeout(function(){showProgress(time + 1000)}, 1000);
        } else {
            document.getElementById("progress").innerHTML = "";
        }
    }

    setTimeout(function(){showProgress(1000)}, 1000);
}

function run(){
    out.innerHTML = "Initializing";
    collect = true;
    stream = true;
}
