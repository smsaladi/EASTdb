/*
Reads in a FASTA file and provides the embedding for each sequence
JavaScript
*/

// import * as loader from './loader';
// import * as ui from './ui';



const IUPAC_CODES =  Array.from('ACDEFGHIKLMNPQRSTVWY*');
TEST_STR = "MALSYRTPTEYLINQLPARLTDNIAVKQVDLIQSDEDCYGSYLNYNLSKEQKKFLVDKGLYLSPYSWRHHSHPACKTIENWLLYKEIGSYAKHVSKQQTIAFISLREGKLNAIKKIHFEKKNNKVACEKICSFNRYYHTKDRLRYSDSSGREIIYKSFDKIGDQIGPRASFYIHDECHYWSPNDLSNFLSRTKAESILATVIHPTEIDVGKDCSHLPFLYEFEVSDNNIFFFPDGNRSEGYEQPKTAGWWLKMRRFYSDGEVYSVTLLRTIGPFHLIYISRGSLASESRRFFDDFNILDLPVKYAKNNLIKKMKLLLRNNFMIKIVSYIKSLKKPDKESAIAKLRMLSEDEFSLEEMIFVDGLVDTLLKNGYKSIWENGWVEWFICGLKDCLPDALHSAMFRSHFKAKQNLDLLMNMKTLSIVVETEDFYPYSKVDCIKEIKEYFLNSCDYLQRDNIDKIIRSSFRGEYIYDYDTSGYYSIRTTSGKMELHGPDSRHLMRSAHDCISYEANIKLFGNNHMEKMRIENRFWFLNDEKRFENAKRESISRCKTIFDEYDAILEEELPDDSIFKGFNKGVSFFKKKTMRMNECLIMLRTGVYNKSKLISNIKHVDDPFSTMEKHKRDRLNKVIKYYIGGVEYEMPSSQVSELEEITEITPINRLSSSNPMDEKTFRNLANKCCFDCIMEIKKIDHVALVNYITETKFMDLLLKDNGLLQKELIELCNFLNIKVNIINQSGTRLIYENDNDNTLILTERHCKLVKTESISDWLLDDNKDFLDVTGVSSIIKNVFDYKRSKKLYDSLSKGTSGVFFNMIKKKNDESEKKKDKNRVIEMMNFFFEDEINEKRKLTGRSEPIYGFFGFAGSGKSREIQNYINTNYNMDGCVTVVSPRVELLKDWEKKISVANKKIRFSTYEKALTLSYYEDELVVVDEIGLLPPGYISLLSLVTAFRVNKISHNIRLSKRNYSKYVENQSSRLVLLGDHLQGRYYNESDFRSLSQPDEIDFIMMNEEILYLNYSHRLNKMHFYKPGVEMLGEDENIISRRFSNVFSAKKTIPEAQLLVASRDEQVRFKELDAKTFGESQGLTFDEIIIVLSPPAVNCSINMWNVAMTRARKGVHFALNGFDTVDDFINRVKGTPVNAMILGSPFEIHRTPGGKDKEIKIIKVCRLGMSNEDVEMKLMGDPFLKSIIPSLDEGLSIEQEYHDIICESPVPKIHLPIESIQGHVSYVSSMLKERGEREFKGDGCMSEQFPDFWKTGEPGHYLSQSERFQSIFPKHQNSDSLTFLAAVKKRLKFSSPSVERERFEKVRHLGNEMLDIFLDKIKIDNKLNSEMMARSYNEYVLKKVSKTANTIASHSSRSEPDWKLNEIFLFMKTQLCTKFEKRFSDAKAGQTLACFSHIILNRFAAPTRYVEKKISEGLGKNFYIHQKKNFDVLNDWVVANNFDSYCLESDYEAFDSSQDCLILAFEYELLKYLGWDQSLLDDYLDLKFNLGCRLGNLAVMRFTGEFGTFLFNTLANMVFTFMTYDLNGTESICFAGDDMCCNRGIKARVDGKYDHILKRLTLKAKAVITKEPTFCGWRLTKYGIFKKPELVLERFLIAIEKGRLLDVIDSYYIECSYAYNLGERLFECFSEKDFSAHYCCIRIVHKNKSLLKGLSLERYRENRRFKHSCKSWIQRPSYRSSTMEDETLIASGSVRCTQMGVSSKTRRLTQFREQKVQFQLNQLMGSPGLLKEYLLLTQMLLMRRETRRSIQKSILEQLSSVSTSLVIMNVRCQEEDVCWLTVEEVEEVELSKPLSLIYPKDQPTSCSYQMQSLTFMMSYLTGPVKCSSSLTMLITVVVPTHLLLRLGQYIACLMSSIAITEWEFQEERVPLEVSIRKYIALRPYQRKMRSQCCQRCVSQERLEEYLMLREALALNLKGVREVLSCLGEKEALLSFEIIVSEKGLVKLRKIYAGLGQAQEVLMKETFLKRFWIINLGLPVNAENFKVTSGKQAMVDQAANLALSNWINETTGFQGEAYGVRLRKLRRRTLLRQHWVSVFKEYVKNLGHANTPAEFTAAESEIYGRVMSDFAAYAFGIMAEEGFSPATIYNEVPASYTIEYPQPVGALNVSFSPAEVSRQFKYYANSSGNSCFANITWRQIGESFAEDIVRYFKELQVDAQSWLVRSNPVLAGNAPWVALDVTDGLDVRRLNPEEKKVIARAKNHLLKSMQLKGRESLSAEALLES"


var input_symbols = {};
var x = 0;


IUPAC_CODES.forEach(function (i) { 
    input_symbols[i] = x; 
    x ++;
});



// load model
async function loadModel(){
    const model = await tf.loadModel('https://www.its.caltech.edu/~saladi/epoch3_pruned_tfjs/model.json');
    // model.summary();
}

// Upload FASTA file
const fastaFile = document.getElementById('fasta-file')

fastaFile.addEventListener('change', evt => {
  var files = evt.target.files;
  // Display thumbnails & issue call to predict each image.
  for (var i = 0, f; f = files[i]; i++) {
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = function(event){
        var contents = event.target.result;
        var lines = contents.split('\n');
        status(lines);

    };
    reader.readAsText(f, "UTF-8");
  }
});



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
    const num_zeros = 3000 - n;
    // pad to size [1, 3000]
    x = x.pad([[0, num_zeros]]);
    // one hot encode using map defined above
    x = tf.oneHot(x, 21);
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


function * infer_batches(sequence_str){
    for (const x of grouper(sequence_str)){
        const seq_arr = read_sequences(x);

        // seq_arr.print(verbose=true);
        var pred = model.predict(seq_arr);
        // model.predict(seq_arr).print();
        yield pred;
    }
}



const outputStatusElement = document.getElementById('status');
const status = msg => outputStatusElement.innerText = msg;

loadModel();
//infer_batches(TEST_STR);




