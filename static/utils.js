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

var pool = workerpool.pool('/static/worker.js', {maxWorkers: 5});

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
    contentType: "application/json",
    start_time: performance.now()
  }).done(function(data) {
    // Display time for request to return
    var req_time = performance.now() - this.start_time;
    // Only work with one query sequence at a time for the app
    data['collection'].forEach(function(query) {
      let query_div = drawResultFrame(query['id'], req_time);
      query['hits'].forEach(function(hit) {
        console.log(hit);
        let hit_div = drawHit(hit['id']);
        query_div.find(".card").append(hit_div);
        
        // Queue alignment to workers
        var promise = pool.exec('pairwiseAlign', [query['seq'], hit['seq']])
          .then(function (result) {
            var [alnQuery, alnHit, alnScore] = result;
            $(hit_div).find(".hit_score").text(alnScore);
            $(hit_div).find(".query_aln").text(alnQuery);
            $(hit_div).find(".hit_aln").text(alnHit);          
          })
          .catch(function (err) {
            console.error(err);
          });
      });
    });
  }).fail(function(data, status) {
    // TODO: display error message!
    console.log("fail");
    console.log(data);
  });
});

function drawResultFrame(name, timing) {
  var tpl = $("#result_query_tpl").clone();
  tpl = tpl.removeAttr('id').removeAttr("style");
  $(tpl).find(".div_query_name").text(name);
  $(tpl).find(".div_timing").text(timing.toFixed(2) + " ms");
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

