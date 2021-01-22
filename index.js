var chart, total, max, min, queue, processes, quant = 2;

//Process class to store data of a process
class Process{
    constructor(idx, arrival, burst){
        this.id             = idx;
        this.arrivalTime    = arrival;
        this.burstTime      = burst;
        this.consumedTime   = 0;
    }
}

//Process Queue to store all the processes
//that are available at a given time for scheduling
class Queue{
    constructor(){
        this.items = [];
    }

    isEmpty(){
        return this.items.length == 0;
    }

    enqueue(element){
        this.items.push(element);
    }

    dequeue(){
        if(this.isEmpty())
            return -1;
        return this.items.shift();
    }

    front(){
        if(this.isEmpty())
            return -1;
        return this.items[0];
    }
}

//Random Processes generator and Chart Initializer
function generateProcesses() {
    document.getElementById("timer").innerHTML = "Current Time - " + 0 + " seconds";
    [min, max] = [15, 20];
    total = Math.floor(Math.random() * (max - min + 1)) + min;
    chart = new CanvasJS.Chart("chartContainer", {
        axisX:{
            title: "---Arrival Time-->"
        },
        axisY:{
            title: "---Burst Time-->",
            minimum: 0,
            maximum: 20,
            interval: 1
        },
        data: [
            {
                type: "stackedColumn",
                color: "blue",
                legendText: "ToBeProcessed",
                showInLegend: "true",
                dataPoints: []
            },
            {
                type: "stackedColumn",
                color: "#33ff00",
                legendText: "Processed",
                showInLegend: "true",
                dataPoints: []
            }
        ]
    });
    chart.render();

    [min, processes]   = [1, []];
    for(var i=0; i<total; i++){
        var label_  = String.fromCharCode(65+i);
        var burst   = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
        var arrival = Math.floor(Math.random() * 3) + min - 1;
        var process = new Process(i, arrival, burst);
        min         = arrival+1;

        processes.push(process);
        chart.data[1].dataPoints.push({label: label_+"(" + arrival + ")", y: 0});
        chart.data[0].dataPoints.push({label: label_+"(" + arrival + ")", y: burst});
    }
    chart.render();
}

//A helper function for FCFS and round-robin alortihm
function fcfsHelper(){
    var front = queue.front();
    if(front.burstTime > front.consumedTime){
        wait = Math.ceil(1000/quant);
        front.consumedTime += quant;
        front.consumedTime  = (front.consumedTime > front.burstTime ? front.burstTime :front.consumedTime);
        chart.data[0].dataPoints[front.id].y = front.burstTime-front.consumedTime;
        chart.data[1].dataPoints[front.id].y = front.consumedTime;
        chart.render();
    }
    queue.front().consumedTime = front.consumedTime;
    return queue.front();
}

//Implementation of First Come First Serve Algortihm
function firstComeFirstServe(){
    quant = 2;
    queue = new Queue();
    queue.enqueue(processes[0]);
    var [i, time] = [1, processes[0].arrivalTime];
    document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";
    (function traverse() {
        if(!queue.isEmpty()){
            var wait = Math.ceil(1000/quant);
            setTimeout(function() {
                var front = queue.front();
                time += Math.min(front.burstTime-front.consumedTime, quant);
                document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";

                while(i<processes.length && processes[i].arrivalTime<=time)
                    queue.enqueue(processes[i++]);

                front = fcfsHelper();
                if(front.burstTime == front.consumedTime){
                    wait = 0;
                    queue.dequeue();
                }
                traverse();
            }, wait);
        }
    })();
}

//Implementation of Shortest Job First Algortihm
function shortestJobFirst(){
    quant = 2;
    var time        = 0;
    var processed   = new Set();
    queue           = new Queue;
    while(processed.size<processes.length){
        var i   = 0;
        var min = -1;
        while(i<processes.length && processes[i].arrivalTime<=time){
            if((min==-1 || min.burstTime>processes[i].burstTime) && !processed.has(processes[i].id))
                min = processes[i];
            i++;
        }
        if(min==-1)
            time+=quant;
        else{
            time = Math.max(time, min.arrivalTime) + min.burstTime;
            processed.add(min.id);
            queue.enqueue(min);
        }
    }
    time = queue.front().arrivalTime;
    document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";
    (function traverse() {
        if(!queue.isEmpty()){
            var wait = Math.ceil(1000/quant);
            setTimeout(function(){
                time += Math.min(queue.front().burstTime-queue.front().consumedTime, quant);
                document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";

                var front = fcfsHelper();
                if(front.burstTime == front.consumedTime){
                    wait = 0;
                    queue.dequeue();
                }
                traverse();
            }, wait);
        }
    })();
}

//Implementation of Shortest Remaining Time First Algortihm
function shortestRemainingTimeFirst(){
    var [ctr, time] = [0, 0];
    quant = 1;
    document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";
    (function traverse() {
        if(ctr<processes.length){
            var wait = Math.ceil(250/quant);
            setTimeout(function() {
                var i   = 0;
                var min = -1;
                while(i<processes.length && processes[i].arrivalTime<=time){
                    if((min==-1 || (min.burstTime-min.consumedTime)>(processes[i].burstTime-processes[i].consumedTime)) && processes[i].burstTime>processes[i].consumedTime)
                        min = processes[i];
                    i++;
                }
                if(min!=-1){
                    processes[min.id].consumedTime     += quant;
                    processes[min.id].consumedTime      = (processes[min.id].consumedTime > processes[min.id].burstTime ? processes[min.id].burstTime : processes[min.id].consumedTime);
                    chart.data[0].dataPoints[min.id].y  = processes[min.id].burstTime-processes[min.id].consumedTime;
                    chart.data[1].dataPoints[min.id].y  = processes[min.id].consumedTime;
                    chart.render();

                    if(processes[min.id].burstTime == processes[min.id].consumedTime)
                        ctr++;
                }
                time += quant;
                document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";
                traverse();
            }, wait);
        }
    })();
}

//Implementation of Round Robin Algortihm
function roundRobin(){
    [quant, queue] = [2, new Queue()];
    queue.enqueue(processes[0]);
    var [i, time] = [1, processes[0].arrivalTime];
    document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";
    (function traverse() {
        if(!queue.isEmpty()){
            var wait = Math.ceil(1000/quant);
            setTimeout(function() {
                var front = queue.front();
                time += Math.min(front.burstTime-front.consumedTime, quant);
                document.getElementById("timer").innerHTML = "Current Time - " + time + " seconds";

                while(i<processes.length && processes[i].arrivalTime<=time)
                    queue.enqueue(processes[i++]);

                fcfsHelper();
                front = queue.dequeue();
                if(front.burstTime > front.consumedTime){
                    wait = 0;
                    queue.enqueue(front);
                }
                traverse();
            }, wait);
        }
    })();
}

//Calling of above Functions
window.onload                                   = generateProcesses();
document.getElementById("regenerate").onclick   = function() {generateProcesses();};
document.getElementById("fcfs").onclick         = function() {firstComeFirstServe();};
document.getElementById("srjf").onclick         = function() {shortestJobFirst();};
document.getElementById("srtf").onclick         = function() {shortestRemainingTimeFirst();};
document.getElementById("round-robin").onclick  = function() {roundRobin();};
