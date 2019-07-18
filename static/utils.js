function toggleDiv(id) {
  var div = document.getElementById(id);
  div.style.display = div.style.display == "block" ? "none" : "block";
}

$("#sampleDataButton").on("click", function(){
  $('#sequenceTextInput').val(
`>EXAMPLE PROTEIN SEQUENCE
MALSYRTPTEYLINQLPARLTDNIAVKQVDLIQSDEDCYGSYLNYNLSKEQKKFLVDKGLYLSPYSWRHHSHPACKTI
ENWLLYKEIGSYAKHVSKQQTIAFISLREGKLNAIKKIHFEKKNNKVACEKICSFNRYYHTKDRLRYSDSSGREIIYKS
FDKIGDQIGPRASFYIHDECHYWSPNDLSNFLSRTKAESILATVIHPTEIDVGKDCSHLPFLYEFEVSDNNIFFFPDGN
RSEGYEQPKTAGWWLKMRRFYSDGEVYSVTLLRTIGPFHLIYISRGSLASESRRFFDDFNILDLPVKYAKNNLIKKMKL
LLRNNFMIKIVSYIKSLKKPDKESAIAKLRMLSEDEFSLEEMIFVDGLVDTLLKNGYKSIWENGWVEWFICGLKDCLPD
ALHSAMFRSHFKAKQNLDLLMNMKTLSIVVETEDFYPYSKVDCIKEIKEYFLNSCDYLQRDNIDKIIRSSFRGEYIYDY
DTSGYYSIRTTSGKMELHGPDSRHLMRSAHDCISYEANIKLFGNNHMEKMRIENRFWFLNDEKRFENAKRESISRCKTI
FDEYDAILEEELPDDSIFKGFNKGVSFFKKKTMRMNECLIMLRTGVYNKSKLISNIKHVDDPFSTMEKHKRDRLNKVIK
YYIGGVEYEMPSSQVSELEEITEITPINRLSSSNPMDEKTFRNLANKCCFDCIMEIKKIDHVALVNYITETKFMDLLLK
DNGLLQKELIELCNFLNIKVNIINQSGTRLIYENDNDNTLILTERHCKLVKTESISDWLLDDNKDFLDVTGVSSIIKNV
FDYKRSKKLYDSLSKGTSGVFFNMIKKKNDESEKKKDKNRVIEMMNFFFEDEINEKRKLTGRSEPIYGFFGFAGSGKSR
EIQNYINTNYNMDGCVTVVSPRVELLKDWEKKISVANKKIRFSTYEKALTLSYYEDELVVVDEIGLLPPGYISLLSLVT
AFRVNKISHNIRLSKRNYSKYVENQSSRLVLLGDHLQGRYYNESDFRSLSQPDEIDFIMMNEEILYLNYSHRLNKMHFY
KPGVEMLGEDENIISRRFSNVFSAKKTIPEAQLLVASRDEQVRFKELDAKTFGESQGLTFDEIIIVLSPPAVNCSINMW
NVAMTRARKGVHFALNGFDTVDDFINRVKGTPVNAMILGSPFEIHRTPGGKDKEIKIIKVCRLGMSNEDVEMKLMGDPF
LKSIIPSLDEGLSIEQEYHDIICESPVPKIHLPIESIQGHVSYVSSMLKERGEREFKGDGCMSEQFPDFWKTGEPGHYL
SQSERFQSIFPKHQNSDSLTFLAAVKKRLKFSSPSVERERFEKVRHLGNEMLDIFLDKIKIDNKLNSEMMARSYNEYVL
KKVSKTANTIASHSSRSEPDWKLNEIFLFMKTQLCTKFEKRFSDAKAGQTLACFSHIILNRFAAPTRYVEKKISEGLGK
NFYIHQKKNFDVLNDWVVANNFDSYCLESDYEAFDSSQDCLILAFEYELLKYLGWDQSLLDDYLDLKFNLGCRLGNLAV
MRFTGEFGTFLFNTLANMVFTFMTYDLNGTESICFAGDDMCCNRGIKARVDGKYDHILKRLTLKAKAVITKEPTFCGWR
LTKYGIFKKPELVLERFLIAIEKGRLLDVIDSYYIECSYAYNLGERLFECFSEKDFSAHYCCIRIVHKNKSLLKGLSLE
RYRENRRFKHSCKSWIQRPSYRSSTMEDETLIASGSVRCTQMGVSSKTRRLTQFREQKVQFQLNQLMGSPGLLKEYLLL
TQMLLMRRETRRSIQKSILEQLSSVSTSLVIMNVRCQEEDVCWLTVEEVEEVELSKPLSLIYPKDQPTSCSYQMQSLTF
MMSYLTGPVKCSSSLTMLITVVVPTHLLLRLGQYIACLMSSIAITEWEFQEERVPLEVSIRKYIALRPYQRKMRSQCCQ
RCVSQERLEEYLMLREALALNLKGVREVLSCLGEKEALLSFEIIVSEKGLVKLRKIYAGLGQAQEVLMKETFLKRFWII
NLGLPVNAENFKVTSGKQAMVDQAANLALSNWINETTGFQGEAYGVRLRKLRRRTLLRQHWVSVFKEYVKNLGHANTPA
EFTAAESEIYGRVMSDFAAYAFGIMAEEGFSPATIYNEVPASYTIEYPQPVGALNVSFSPAEVSRQFKYYANSSGNSCF
ANITWRQIGESFAEDIVRYFKELQVDAQSWLVRSNPVLAGNAPWVALDVTDGLDVRRLNPEEKKVIARAKNHLLKSMQ
LKGRESLSAEALLES`
    );
});

$("#resetButton").on("click", function() {
  // TODO: FILL ME OUT
});

function objectifyForm(form) {
  // Turns a form into key-value pairs
  // https://stackoverflow.com/a/1186309/2320823
  var formArray = form.serializeArray();
  var data = {};
  for (var i = 0; i < formArray.length; i++){
    data[formArray[i]['name']] = formArray[i]['value'];
  }
  return data;
}

function rmspace(text) {
  // Removes newline characters and spaces
  // https://stackoverflow.com/a/10805180/2320823
  return text.replace(/[\n\r\s]+/g, "");
}

function parse_fasta(text) {
  if (!text.includes('>'))
    return [{"id": "", "seq": rmspace(text)}];
  var entries = text.split('>');
  entries.shift();
  return entries.map(function(e) {
    var lines = e.split('\n');    
    var header = lines.shift();
    var seq = lines.join('');
    return {"id": header, "seq": rmspace(seq)};
  });
}

$("#queryForm").on("submit", function(e) {
  // Otherwise, page refreshes
  e.preventDefault();

  var formData = objectifyForm($(this));

  // Parse form data into payload
  var meta = {"action": "search",
              "email": formData['email'],
              "hitcount": formData['hitcount']};
  var seqs = parse_fasta(formData['seqInput']);
  var payload = {"messages": meta, "collection": seqs};

  // then submit
  $.ajax({
    url: '/query',
    method: 'POST',
    data: JSON.stringify(payload),
    dataType: 'json',
    contentType: "application/json"
  }).done(function(data) {
    // Only work with one query sequence at a time for the app
    data['collection'].forEach(async function(query) {
      var query_div = drawResultFrame(query['id']);
      query['hits'].forEach(async function(hit) {
        console.log(hit);
        query_div.find(".card").append(
          drawHit(hit['ids'])
        );

        setTimeout(function () {
          pairwiseAlign(query['seq'], hit['seq']
            ).then(function(d) {
              var [alnQuery, alnHit, alnScore] = d;
              $(query_div).find(".hit_score").text(alnScore);
              $(query_div).find(".query_aln").text(alnQuery);
              $(query_div).find(".hit_aln").text(alnHit);
            });
          }, 0);
      });
    });
  }).fail(function(data, status) {
    // TODO: display error message!
    console.log("fail");
    console.log(data);
  });
});

function drawResultFrame(name) {
  var tpl = $("#result_query_tpl").clone();
  tpl = tpl.removeAttr('id').removeAttr("style");
  $(tpl).find(".div_query_name").text(name);
  $("#output").append(tpl);
  return tpl;
}

function drawHit(hit) {
  var tpl = $("#result_hit_tpl").clone();
  tpl = tpl.removeAttr('id').removeAttr("style");

  $(tpl).find(".hit_id").text(hit);
  $(tpl).find(".hit_url").attr("href", "https://uniprot.org/uniprot/" + hit);

  return tpl;
}


async function pairwiseAlign(protA, protB) {
  // Essentially calls code from Sequence Manipulation Suite (Paul Stoddard)
  // License: GPLv2 or later (https://www.bioinformatics.org/sms2/mirror.html)
  
  // Set up scoring
	var scoreSet = new ScoreSet();
	scoreSet.setScoreSetParam(
    scoringMatrix=new Blosum62(), gapPenalty=0.5, beginGapPenalty=2, endGapPenalty=0.5);

	var alignment = new AlignPairLinear();
  alignment.setAlignParam(protA, protB, scoreSet);
  alignment.align();

  var alnA = alignment.getAlignedM();
  var alnB = alignment.getAlignedN();
  var score = alignment.score;

  return await [alnA, alnB, score];
}
