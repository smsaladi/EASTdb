/*
Reads in a FASTA file and provides the embedding for each sequence
JavaScript
*/


const IUPAC_CODES =  Array.from('ACDEFGHIKLMNPQRSTVWY*');
TEST_STR = "ACDEFGHIKLMNPQRSTVWY"


var input_symbols = {};
var x = 0;


IUPAC_CODES.forEach(function (i) { 
    input_symbols[i] = x; 
    x ++;
});


// Upload FASTA file
const fastaFile = document.getElementById('fasta-file')

fastaFile.addEventListener('change', evt => {
  var files = evt.target.files;
  parse_fasta_files(files);
  
});

// Parse fasta file contents 
function parse_fasta_files(files){
    for (var i = 0, f; f = files[i]; i++) {
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = function(event){
        var contents = event.target.result;
        fasta = contents.trim();

        // split on newlines... 
        var sequences = fasta.split('\n>');
        sequences[0] = sequences[0].replace('>', '');
        // get ID from first line
        // ID: tr|K4PEV9|K4PEV9_9VIRU
        // rec_ids = [K4PEV9, K4PEV9_9VIRU]
        var seq1_data = sequences[0].split('\n');
        var l1_data = seq1_data[0].split(' ');
        var rec_ids = l1_data[0].split('|').slice(1,);
        var seq1_id = rec_ids[0];
        var seq1_str = seq1_data.slice(1,).join('').trim();
        status(seq1_str);
        //infer_batches(seq1_str);

        for (var j = 1, seq; seq = sequences[j]; j++){
            var lines = sequences[j].split('\n');
            // join the remaining lines back into a single string without newlines and 
            // trailing or leading spaces
            var seq_str = lines.slice(1,).join('').trim();
            if (!seq_str){
                return false;
            }
            // status(seq_str);
            var seq_id = rec_ids[j];
        }

    };
    reader.readAsText(f, "UTF-8");
  }
}

function read_sequences(seq_arr){
    const n = seq_arr.length;
    // encode string
    for (var i = 0; i < n; i++){
        seq_arr[i] = input_symbols[seq_arr[i]];
        var indx = seq_arr[i];
        //tf_arr[indx] = 1;
    }
    // convert js arary to tensor
    var x = tf.tensor1d(seq_arr, 'int32')
    x.print(verbose=true);
    const num_zeros = 2000 - n;
    // pad to size [1, 2000]
    x = x.pad([[0, num_zeros]], 20);
    x.print(verbose=true);
    status(x);
    // one hot encode using map defined above
    x = tf.oneHot(x, 21);
    x.print(verbose=true);
    // status(x);
    x = x.reshape([1, 2000, 21]);
    // x.print(verbose=true);
    status(x);
    return x;
}

// generator for string
function* get_generator(string){
    for(var i = 0; i < string.length; i++){
        yield string.charAt(i);
    }
}


// read_sequences(TEST_STR);

// Groups an iterable into size
function* grouper(TEST_STR, size=32){
    var current_group = [];
    const gen = get_generator(TEST_STR);
    for (const g of gen){
        current_group.push(g);
        if (current_group.length==size){
            yield current_group;
            current_group =[];
        }
    }
    if (current_group){
        yield current_group;
    }
}


async function infer_batches(sequence_str){
    // load model
    const model = await tf.loadModel('https://www.its.caltech.edu/~saladi/epoch3_pruned_tfjs/model.json');
    // model.summary();
    for (const x of grouper(sequence_str)){
        //console.log(x);
        const seq_arr = read_sequences(x);
        seq_arr.print(verbose=true);
        const pred = model.predictOnBatch(seq_arr);
        const pred_str = JSON.stringify(pred);
        model.predictOnBatch(tf.ones([1, 2000, 21])).print();
        //model.predict(seq_arr).print();
        console.log(pred_str);
        // yield pred;

    }
}

const url = 'http://127.0.0.1:5000/get_nums';

var params = {
    numbers: [1, 2, 3] 
};

function buildUrl(url, parameters){
  var qs = "";
  for(var key in parameters) {
    var value = parameters[key];
    qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  }
  if (qs.length > 0){
    qs = qs.substring(0, qs.length-1); //chop off last "&"
    url = url + "?" + qs;
  }
  return url;
}

const request_url =  buildUrl(url, params);
// console.log(request_url);

fetch(request_url)
  .then(
    function(response) {
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' +
          response.status);
        return;
      }
      // Examine the text in the response
      response.json().then(function(data) {
        console.log(data);
      });
    }
  )
  .catch(function(err) {
    console.log('Fetch Error :-S', err);
  });

const outputStatusElement = document.getElementById('status');
const status = msg => outputStatusElement.innerText = msg;

infer_batches(TEST_STR);




