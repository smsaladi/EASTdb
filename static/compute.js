/*
Reads in a FASTA file and provides the embedding for each sequence
JavaScript
*/


const IUPAC_CODES =  Array.from('ACDEFGHIKLMNPQRSTVWY*');

var input_symbols = {};
var x = 0;

IUPAC_CODES.forEach(function (i) { 
    input_symbols[i] = x;
    x ++;
});

function encode_seq(seq) {
  
}

function prep_seq(seq) {

}

// Parse sequence box
function read_sequences(seq_arr) {
    const n = seq_arr.length;
    // encode string
    for (var i = 0; i < n; i++) {
        seq_arr[i] = input_symbols[seq_arr[i]];
        var indx = seq_arr[i];
        //tf_arr[indx] = 1;
    }
    // convert js arary to tensor
    var x = tf.tensor1d(seq_arr, 'int32')
    const num_zeros = 2000 - n;
    // pad to size [1, 2000]
    x = x.pad([[0, num_zeros]]);
    // one hot encode using map defined above
    x = tf.oneHot(x, 21);
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
    if (current_group)
        yield current_group;
}


async function infer_batches(sequence_str){
    const model = await tf.loadModel('https://www.its.caltech.edu/~saladi/epoch3_pruned_tfjs/model.json');
    for (const x of grouper(sequence_str)){
        const seq_arr = read_sequences(x);
        const pred = model.predictOnBatch(seq_arr);
        // model.predictOnBatch(seq_arr).print();
        yield pred;

    }
}

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

const request_url = buildUrl(url, params);

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
