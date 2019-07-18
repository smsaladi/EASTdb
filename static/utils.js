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
  var meta = {"email": formData['email'], "action": "search"};
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
    data['collection'] = [data['collection'][0]]
    data['collection'].map(function(query) {
      var query_div = drawResultFrame(query['id']);
      query['hits'].map(function(hit) {
        var [alnQuery, alnHit, alnScore] = pairwiseAlign(query['seq'], hit['seq']);
        console.log(hit);
        drawHit(hit['ids'], alnQuery, alnHit, alnScore).appendTo(query_div);
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

function drawHit(hit, alnQuery, alnHit, alnScore) {
  var tpl = $("#result_hit_tpl").clone();
  tpl = tpl.removeAttr('id').removeAttr("style");

  $(tpl).find(".hit_id").text(hit);
  $(tpl).find(".hit_url").attr("href", "https://uniprot.org/uniprot/" + hit);
  $(tpl).find(".hit_score").text(alnScore);
  $(tpl).find(".query_aln").text(alnQuery);
  $(tpl).find(".hit_aln").text(alnHit);

  return tpl;
}



function pairwiseAlign(protA, protB) {
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

  return [alnA, alnB, score];
}
